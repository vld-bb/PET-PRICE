"""SQLAlchemy 2.0 ORM models for LemmikuHind."""

from datetime import datetime
from typing import List, Optional
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Store(Base):
    __tablename__ = "stores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    domain: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    logo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    offers: Mapped[List["StoreOffer"]] = relationship(
        "StoreOffer", back_populates="store", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "domain": self.domain,
            "logo_url": self.logo_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ean: Mapped[Optional[str]] = mapped_column(String(32), unique=True, nullable=True, index=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    brand: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    weight_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    species: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    category_group: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    category_slug: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    custom_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    custom_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    offers: Mapped[List["StoreOffer"]] = relationship(
        "StoreOffer", back_populates="product", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_products_ean", "ean"),
        Index("idx_products_brand", "brand"),
        Index("idx_products_is_active", "is_active"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "ean": self.ean,
            "slug": self.slug,
            "title": self.title,
            "brand": self.brand,
            "weight_kg": float(self.weight_kg) if self.weight_kg is not None else None,
            "image_url": self.image_url,
            "category": self.category,
            "species": self.species,
            "category_group": self.category_group,
            "category_slug": self.category_slug,
            "is_active": self.is_active,
            "is_featured": self.is_featured,
            "custom_description": self.custom_description,
            "custom_title": self.custom_title,
            "display_title": self.custom_title or self.title,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class StoreOffer(Base):
    __tablename__ = "store_offers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    store_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("stores.id", ondelete="CASCADE"), nullable=False
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    price_per_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    override_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    in_stock: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_scraped_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    product: Mapped["Product"] = relationship("Product", back_populates="offers")
    store: Mapped["Store"] = relationship("Store", back_populates="offers")
    price_history: Mapped[List["PriceHistory"]] = relationship(
        "PriceHistory", back_populates="offer", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("product_id", "store_id", name="uq_product_store"),
        Index("idx_offers_product", "product_id"),
        Index("idx_offers_is_active", "is_active"),
    )

    @property
    def effective_price(self) -> float:
        return self.override_price if self.override_price is not None else self.price

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "store_id": self.store_id,
            "url": self.url,
            "price": float(self.price),
            "price_per_kg": float(self.price_per_kg) if self.price_per_kg is not None else None,
            "override_price": float(self.override_price) if self.override_price is not None else None,
            "effective_price": float(self.effective_price),
            "in_stock": self.in_stock,
            "is_active": self.is_active,
            "last_scraped_at": self.last_scraped_at.isoformat() if self.last_scraped_at else None,
            "store": self.store.to_dict() if self.store else None,
        }


class PriceHistory(Base):
    __tablename__ = "price_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    offer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("store_offers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    price: Mapped[float] = mapped_column(Float, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    offer: Mapped["StoreOffer"] = relationship("StoreOffer", back_populates="price_history")

    __table_args__ = (Index("idx_price_history_offer", "offer_id"),)

    def to_dict(self):
        return {
            "id": self.id,
            "offer_id": self.offer_id,
            "price": float(self.price),
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else None,
        }


class BannerPlacement(Base):
    __tablename__ = "banner_placements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    identifier: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    banners: Mapped[List["Banner"]] = relationship(
        "Banner", back_populates="placement", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "identifier": self.identifier,
            "name": self.name,
            "description": self.description,
            "width": self.width,
            "height": self.height,
            "is_active": self.is_active,
            "banners_count": len(self.banners) if self.banners else 0,
        }


class Banner(Base):
    __tablename__ = "banners"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    placement_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("banner_placements.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    target_url: Mapped[str] = mapped_column(Text, nullable=False)
    alt_text: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    client_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    weight: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    impressions_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    clicks_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    placement: Mapped["BannerPlacement"] = relationship("BannerPlacement", back_populates="banners")

    __table_args__ = (
        Index("idx_banners_placement", "placement_id"),
        Index("idx_banners_active", "is_active"),
    )

    @property
    def ctr_percent(self) -> float:
        if self.impressions_count <= 0:
            return 0.0
        return round((self.clicks_count / self.impressions_count) * 100, 2)

    def to_dict(self):
        return {
            "id": self.id,
            "placement_id": self.placement_id,
            "placement_identifier": self.placement.identifier if self.placement else None,
            "title": self.title,
            "image_url": self.image_url,
            "target_url": self.target_url,
            "alt_text": self.alt_text,
            "client_name": self.client_name,
            "weight": self.weight,
            "impressions_count": self.impressions_count,
            "clicks_count": self.clicks_count,
            "ctr_percent": self.ctr_percent,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
