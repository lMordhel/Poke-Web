from fastapi import APIRouter
from app.db import db
from datetime import datetime, timezone

router = APIRouter()

@router.get("/")
async def get_home_data():
    """
    Returns data for the home page:
    - 4 most popular or newest products
    - Number of total products
    - Number of total orders
    - Fake but high rating (could be queried from reviews later)
    - Best seller name
    """
    # 1. Total Products
    total_products = await db.products.count_documents({})

    # 2. Total Orders
    total_orders = await db.orders.count_documents({})

    # 3. Featured/Popular Products (Just getting newest ones for now)
    cursor = db.products.find({}).sort("_id", -1).limit(4)
    products_db = await cursor.to_list(length=4)
    
    featured_products = []
    for doc in products_db:
        doc["id"] = str(doc.pop("_id"))
        # El frontend con ProductCard espera 'img' pero en BBDD a veces se usa 'image_url'
        if "image_url" in doc and "img" not in doc:
            doc["img"] = doc["image_url"]
        featured_products.append(doc)

    # 4. Best Seller logic: Aggregation to find most sold product
    # We will approximate this or just pick the top featured
    best_seller = None
    if featured_products:
        best_seller = {"name": featured_products[0].get("name", "N/A")}

    # Advanced Best Seller Aggregation (Optional but better)
    try:
        pipeline = [
            {"$unwind": "$items"},
            {"$group": {"_id": "$items.id", "total_sold": {"$sum": "$items.quantity"}, "name": {"$first": "$items.name"}}},
            {"$sort": {"total_sold": -1}},
            {"$limit": 1}
        ]
        best_sellers_cursor = db.orders.aggregate(pipeline)
        best_sellers_list = await best_sellers_cursor.to_list(length=1)
        if best_sellers_list:
            best_seller = {"name": best_sellers_list[0].get("name")}
    except Exception as e:
        pass # Fallback to featured[0] if it fails

    return {
        "featuredProducts": featured_products,
        "stats": {
            "total_products": total_products,
            "total_orders": total_orders,
            "rating": "4.9" # Harcoded review average for now
        },
        "bestSeller": best_seller
    }
