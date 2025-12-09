from dataclasses import dataclass
from datetime import datetime, timedelta, UTC
from typing import Dict, Tuple


@dataclass
class UserTrustProfile:
    """User's trust profile for moderation scoring"""
    user_id: int
    total_sales: int
    successful_sales: int
    rating: float  # 0-5 stars
    account_age_months: int
    verification_status: str  # unverified, email_verified, phone_verified, identity_verified
    total_flags: int
    total_rejections: int
    clean_listings: int


def get_user_trust_profile(user_id: int, conn) -> UserTrustProfile:
    """
    Get user's complete trust profile from database

    Args:
        user_id: User ID
        conn: Database connection

    Returns:
        UserTrustProfile with all trust metrics
    """
    cursor = conn.cursor()

    # Get user info
    cursor.execute("""
        SELECT
            id,
            registration_date,
            email_verified,
            phone_verified,
            identity_verified
        FROM users
        WHERE id = ?
    """, (user_id,))

    user = cursor.fetchone()

    if not user:
        raise ValueError(f"User {user_id} not found")

    # Calculate account age in months
    registration_date = datetime.fromisoformat(user['registration_date'])
    account_age_months = max(0, (datetime.now(UTC) - registration_date).days // 30)

    # Get verification status
    if user.get('identity_verified'):
        verification_status = 'identity_verified'
    elif user.get('phone_verified'):
        verification_status = 'phone_verified'
    elif user.get('email_verified'):
        verification_status = 'email_verified'
    else:
        verification_status = 'unverified'

    # Get sales statistics
    cursor.execute("""
        SELECT
            COUNT(*) as total_sales,
            SUM(CASE WHEN sale_completed = 1 THEN 1 ELSE 0 END) as successful_sales
        FROM items
        WHERE user_id = ? AND auction_closed = 1
    """, (user_id,))

    sales = cursor.fetchone()
    total_sales = sales['total_sales'] if sales else 0
    successful_sales = sales['successful_sales'] if sales else 0

    # Get user rating (from reviews/feedback)
    cursor.execute("""
        SELECT AVG(rating) as avg_rating
        FROM user_reviews
        WHERE reviewed_user_id = ?
    """, (user_id,))

    rating_result = cursor.fetchone()
    rating = rating_result['avg_rating'] if rating_result and rating_result['avg_rating'] else 0.0

    # Get moderation history
    cursor.execute("""
        SELECT
            SUM(CASE WHEN moderation_status = 'flagged' THEN 1 ELSE 0 END) as flags,
            SUM(CASE WHEN moderation_status = 'rejected' THEN 1 ELSE 0 END) as rejections,
            SUM(CASE WHEN moderation_status = 'approved' AND moderation_score >= 80 THEN 1 ELSE 0 END) as clean
        FROM items
        WHERE user_id = ?
    """, (user_id,))

    mod = cursor.fetchone()
    total_flags = mod['flags'] if mod and mod['flags'] else 0
    total_rejections = mod['rejections'] if mod and mod['rejections'] else 0
    clean_listings = mod['clean'] if mod and mod['clean'] else 0

    return UserTrustProfile(
        user_id=user_id,
        total_sales=total_sales,
        successful_sales=successful_sales,
        rating=rating,
        account_age_months=account_age_months,
        verification_status=verification_status,
        total_flags=total_flags,
        total_rejections=total_rejections,
        clean_listings=clean_listings
    )


def calculate_trust_score(profile: UserTrustProfile) -> int:
    """
    Calculate user's trust score (0-100)

    Breakdown:
    - Sales history: 40 points max
    - Rating: 20 points max
    - Account age: 15 points max
    - Verification status: 15 points max
    - Moderation history: 10 points max (can be negative)

    Args:
        profile: UserTrustProfile

    Returns:
        Trust score (0-100)
    """
    trust_score = 0

    # 1. Sales history (40 points max)
    # Each successful sale = 0.8 points
    trust_score += min(profile.successful_sales * 0.8, 40)

    # 2. Rating (20 points max)
    # 5-star rating = 20 points
    trust_score += (profile.rating / 5.0) * 20

    # 3. Account age (15 points max)
    # Each month = 0.5 points
    trust_score += min(profile.account_age_months * 0.5, 15)

    # 4. Verification status (15 points max)
    verification_points = {
        'unverified': 0,
        'email_verified': 5,
        'phone_verified': 10,
        'identity_verified': 15,
    }
    trust_score += verification_points.get(profile.verification_status, 0)

    # 5. Moderation history (10 points max, can go negative)
    moderation_score = (
        profile.clean_listings * 0.5  # +0.5 per clean listing
        - profile.total_flags * 2      # -2 per flag
        - profile.total_rejections * 5  # -5 per rejection
    )
    trust_score += max(min(moderation_score, 10), -20)

    # Clamp to 0-100 range
    return max(0, min(100, int(trust_score)))


def get_trust_level(trust_score: int) -> str:
    """
    Get trust level from score

    Args:
        trust_score: 0-100 trust score

    Returns:
        Trust level: untrusted, new, verified, trusted, elite
    """
    if trust_score < 20:
        return 'untrusted'
    elif trust_score < 40:
        return 'new'
    elif trust_score < 60:
        return 'verified'
    elif trust_score < 80:
        return 'trusted'
    else:
        return 'elite'


def get_moderation_severity_multiplier(trust_level: str) -> float:
    """
    Get moderation severity multiplier based on trust level

    Higher multiplier = more strict moderation
    Lower multiplier = less strict moderation

    Args:
        trust_level: Trust level string

    Returns:
        Multiplier (0.6 to 1.5)
    """
    multipliers = {
        'untrusted': 1.5,  # 50% more strict
        'new': 1.2,        # 20% more strict
        'verified': 1.0,   # Standard moderation
        'trusted': 0.8,    # 20% less strict
        'elite': 0.6,      # 40% less strict
    }
    return multipliers.get(trust_level, 1.0)


def apply_trust_multiplier_to_score(moderation_score: int, trust_level: str) -> int:
    """
    Apply trust-based adjustment to moderation score

    Trusted users get score boost, untrusted users get penalty

    Args:
        moderation_score: Original moderation score (0-100)
        trust_level: User's trust level

    Returns:
        Adjusted moderation score (0-100)
    """
    multiplier = get_moderation_severity_multiplier(trust_level)

    # Inverse multiplier for score (higher multiplier = lower score boost)
    # untrusted: 0.67x score, elite: 1.67x score
    score_multiplier = 2.0 - multiplier

    adjusted_score = int(moderation_score * score_multiplier)

    return max(0, min(100, adjusted_score))


def get_trust_badge(trust_level: str) -> Dict[str, str]:
    """
    Get display badge for trust level

    Args:
        trust_level: Trust level string

    Returns:
        Dict with emoji, label, and color
    """
    badges = {
        'untrusted': {
            'emoji': '⚠️',
            'label': 'New Account',
            'color': '#DC2626',
        },
        'new': {
            'emoji': '🌱',
            'label': 'New Seller',
            'color': '#F59E0B',
        },
        'verified': {
            'emoji': '✅',
            'label': 'Verified',
            'color': '#3B82F6',
        },
        'trusted': {
            'emoji': '⭐',
            'label': 'Trusted Seller',
            'color': '#10B981',
        },
        'elite': {
            'emoji': '👑',
            'label': 'Elite Seller',
            'color': '#8B5CF6',
        },
    }
    return badges.get(trust_level, badges['new'])


def should_skip_manual_review(trust_level: str, moderation_score: int) -> bool:
    """
    Determine if user can skip manual review based on trust

    Args:
        trust_level: User's trust level
        moderation_score: Item moderation score

    Returns:
        True if can skip manual review
    """
    # Elite and trusted sellers with high scores can skip review
    if trust_level == 'elite' and moderation_score >= 80:
        return True

    if trust_level == 'trusted' and moderation_score >= 85:
        return True

    # Everyone else goes through normal review process
    return False


def get_user_trust_info(user_id: int, conn) -> Dict:
    """
    Get complete trust info for a user (for display)

    Args:
        user_id: User ID
        conn: Database connection

    Returns:
        Dict with trust score, level, badge, and stats
    """
    profile = get_user_trust_profile(user_id, conn)
    trust_score = calculate_trust_score(profile)
    trust_level = get_trust_level(trust_score)
    badge = get_trust_badge(trust_level)

    return {
        'user_id': user_id,
        'trust_score': trust_score,
        'trust_level': trust_level,
        'badge': badge,
        'stats': {
            'total_sales': profile.total_sales,
            'successful_sales': profile.successful_sales,
            'rating': round(profile.rating, 2),
            'account_age_months': profile.account_age_months,
            'verification_status': profile.verification_status,
            'clean_listings': profile.clean_listings,
        },
        'moderation': {
            'severity_multiplier': get_moderation_severity_multiplier(trust_level),
            'can_skip_review': should_skip_manual_review(trust_level, 100),
        }
    }


def moderate_with_trust(name: str, description: str, user_id: int, conn) -> Dict:
    """
    Moderate content with trust-based adjustments

    Args:
        name: Item name
        description: Item description
        user_id: User ID
        conn: Database connection

    Returns:
        Enhanced moderation result with trust adjustments
    """
    from utils.content_moderation import moderate_item_fields

    # Get base moderation result
    base_result = moderate_item_fields(name, description)

    # Get user trust info
    try:
        profile = get_user_trust_profile(user_id, conn)
        trust_score = calculate_trust_score(profile)
        trust_level = get_trust_level(trust_score)

        # Apply trust multiplier to moderation score
        adjusted_score = apply_trust_multiplier_to_score(
            base_result['score'],
            trust_level
        )

        # Check if can skip manual review
        can_skip_review = should_skip_manual_review(trust_level, adjusted_score)

        # Adjust status based on trust
        status = base_result['status']
        if can_skip_review and status == 'pending':
            status = 'approved'

        return {
            **base_result,
            'score': adjusted_score,
            'original_score': base_result['score'],
            'status': status,
            'trust_level': trust_level,
            'trust_score': trust_score,
            'trust_adjustment': adjusted_score - base_result['score'],
            'can_skip_review': can_skip_review,
        }

    except Exception as e:
        print(f"Error getting trust profile: {e}")
        # Fallback to base moderation if trust calculation fails
        return base_result
