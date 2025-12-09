# BidGoatMobile/models/FlexBid.py
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class FlexBid(Base):
    __tablename__ = "flex_bids"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    auction_id = Column(Integer, ForeignKey("auctions.id"), nullable=False)

    amount = Column(Float, nullable=False)
    strategy = Column(String, default="increment")  # e.g. 'increment', 'max_cap'
    max_amount = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="flex_bids")
    auction = relationship("Auction", back_populates="flex_bids")
