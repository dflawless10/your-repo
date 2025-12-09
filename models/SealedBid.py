# BidGoatMobile/models/SealedBid.py
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class SealedBid(Base):
    __tablename__ = "sealed_bids"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    auction_id = Column(Integer, ForeignKey("auctions.id"), nullable=False)

    amount = Column(Float, nullable=False)
    status = Column(String, default="submitted")  # submitted, revealed, won, lost
    created_at = Column(DateTime, default=datetime.utcnow)
    revealed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="sealed_bids")
    auction = relationship("Auction", back_populates="sealed_bids")
