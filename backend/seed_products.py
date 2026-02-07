import asyncio
import sys
import os

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import db
from app.schemas.product import ProductCreate

async def seed_products():
    """
    Seed the database with initial products
    """
    products_collection = db.products
    
    # Clear existing products
    await products_collection.delete_many({})
    
    # Initial products data
    initial_products = [
        ProductCreate(
            name="Pikachu Plush",
            price=29.99,
            type="Electric",
            image_url="/src/assets/pikachupush.webp",
            description="Adorable Pikachu plush perfect for any Pokémon fan!",
            is_new=True,
            stock=50
        ),
        ProductCreate(
            name="Charmander Plush",
            price=27.99,
            type="Fire",
            image_url="/src/assets/charmanderpush.webp",
            description="Cute Charmander plush with its fiery tail!",
            is_new=False,
            stock=45
        ),
        ProductCreate(
            name="Squirtle Plush",
            price=27.99,
            type="Water",
            image_url="/src/assets/squirtlepush.webp",
            description="Lovely Squirtle plush ready for adventure!",
            is_new=False,
            stock=40
        ),
        ProductCreate(
            name="Bulbasaur Plush",
            price=27.99,
            type="Grass",
            image_url="/src/assets/bulbasaurpush.webp",
            description="Charming Bulbasaur plush with its bulb seed!",
            is_new=True,
            stock=35
        ),
        ProductCreate(
            name="Eevee Plush",
            price=32.99,
            type="Normal",
            image_url="/src/assets/eeveepush.webp",
            description="Fluffy Eevee plush that can evolve into many forms!",
            is_new=True,
            stock=30
        ),
        ProductCreate(
            name="Jigglypuff Plush",
            price=24.99,
            type="Fairy",
            image_url="/src/assets/jigglypuffpush.webp",
            description="Soft Jigglypuff plush that loves to sing!",
            is_new=False,
            stock=25
        ),
        ProductCreate(
            name="Gengar Plush",
            price=34.99,
            type="Ghost",
            image_url="/src/assets/gengarpush.webp",
            description="Spooky Gengar plush perfect for Halloween!",
            is_new=True,
            stock=20
        ),
        ProductCreate(
            name="Snorlax Plush",
            price=49.99,
            type="Normal",
            image_url="/src/assets/snorlaxpush.webp",
            description="Giant Snorlax plush that loves to sleep!",
            is_new=False,
            stock=15
        ),
        ProductCreate(
            name="Charizard Plush",
            price=27.99,
            type="Fire",
            image_url="/src/assets/charizardpush.webp",
            description="Majestic Charizard plush with fire-breathing action!",
            is_new=False,
            stock=25
        ),
    ]
    
    # Insert products
    products_to_insert = [product.model_dump() for product in initial_products]
    
    result = await products_collection.insert_many(products_to_insert)
    
    print(f"Successfully seeded {len(result.inserted_ids)} products to the database!")
    print("Products added:")
    
    for i, product in enumerate(initial_products, 1):
        print(f"  {i}. {product.name} - ${product.price} ({product.type})")

if __name__ == "__main__":
    asyncio.run(seed_products())