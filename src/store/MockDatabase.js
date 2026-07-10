export const INITIAL_CATEGORIES = [
    { id: '1', name: 'Electronics', slug: 'electronics', icon: 'Laptop', description: 'Gadgets, smartphones, and compute accessories.' },
    { id: '2', name: 'Clothing', slug: 'clothing', icon: 'Shirt', description: 'Trendy, stylish and comfortable wear.' },
    { id: '3', name: 'Beauty', slug: 'beauty', icon: 'Sparkles', description: 'Cosmetics, skincare products and wellness essentials.' },
    { id: '4', name: 'Home & Kitchen', slug: 'home-kitchen', icon: 'Home', description: 'Modern kitchen appliances and home decor.' },
    { id: '5', name: 'Sports', slug: 'sports', icon: 'Activity', description: 'Fitness gear, sportswear, and outdoor equipment.' },
    { id: '6', name: 'Accessories', slug: 'accessories', icon: 'Watch', description: 'Bags, wallets, sunglasses and watches.' }
];

export const INITIAL_PRODUCTS = [
    {
        id: 'prod_1',
        name: 'Pro Noise-Cancelling Headphones',
        description: 'Experience pure acoustic bliss with industry-leading Active Noise Cancellation, high fidelity wireless audio, up to 40 hours of battery life, and ultra-comfortable memory foam earcups.',
        price: 349.99,
        discountPrice: 299.99,
        category: 'electronics',
        rating: 4.8,
        reviewsCount: 124,
        stock: 14,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        featured: true
    },
    {
        id: 'prod_2',
        name: 'Smart Fitness Watch',
        description: 'Track your heart rate, sleep cycles, steps, and sports activities dynamically in real-time. Features a vibrant AMOLED display, built-in GPS, waterproof design, and a sleek modern bezel.',
        price: 199.99,
        discountPrice: 179.99,
        category: 'electronics',
        rating: 4.5,
        reviewsCount: 88,
        stock: 25,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
        featured: true
    },
    {
        id: 'prod_3',
        name: 'Ultra-Compact Mechanical Keyboard',
        description: 'Designed for writers and gamers alike, this 65% design keyboard features hot-swappable mechanical switches, RGB customization, double-shot PBT keycaps, and durable aluminum construction.',
        price: 129.99,
        discountPrice: null,
        category: 'electronics',
        rating: 4.7,
        reviewsCount: 42,
        stock: 8,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
        featured: false
    },
    {
        id: 'prod_4',
        name: 'Classic Denim Trucker Jacket',
        description: 'A timeless layering piece handcrafted from premium indigo dyed denim. Featuring clean metal button closures, standard chest pockets, and side welt pockets. Pre-shrunk for the perfect fit.',
        price: 89.99,
        discountPrice: 69.99,
        category: 'clothing',
        rating: 4.4,
        reviewsCount: 156,
        stock: 35,
        image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
        featured: false
    },
    {
        id: 'prod_5',
        name: 'Premium Wool Double-Breasted Coat',
        description: 'Crafted from a heavyweight and elegant recycled wool blend, this refined coat offers superior insulation and a tailored, formal silhouette perfect for chilly seasons.',
        price: 249.99,
        discountPrice: null,
        category: 'clothing',
        rating: 4.6,
        reviewsCount: 29,
        stock: 12,
        image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80',
        featured: true
    },
    {
        id: 'prod_6',
        name: 'Minimalist Cotton Crewneck Tee',
        description: 'An everyday wardrobe essential spun from ultra-soft 100% organic cotton. Features a durable midweight feel that gets softer with each wash, a robust ribbed collar, and double-needle stitching.',
        price: 29.99,
        discountPrice: 24.99,
        category: 'clothing',
        rating: 4.3,
        reviewsCount: 210,
        stock: 150,
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
        featured: false
    },
    {
        id: 'prod_7',
        name: 'Advanced Hydra-Restore Face Serum',
        description: 'Infused with clean multi-molecular hyaluronic acid and vitamin B5, this daily skin treatment penetrates deeply to instantly plump up moisture layers, reducing dry lines and clarifying the skin barrier.',
        price: 45.00,
        discountPrice: 38.00,
        category: 'beauty',
        rating: 4.9,
        reviewsCount: 312,
        stock: 60,
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
        featured: true
    },
    {
        id: 'prod_8',
        name: 'Organic Purifying Mud Mask',
        description: 'Formulated with mineral-rich Dead Sea mud, activated charcoal, and organic botanicals. Absorbs excess oil, clears impurities, minimizes the appearance of pores, and leaves skin revitalized and glowing.',
        price: 32.00,
        discountPrice: null,
        category: 'beauty',
        rating: 4.5,
        reviewsCount: 77,
        stock: 45,
        image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=80',
        featured: false
    },
    {
        id: 'prod_9',
        name: '15-Bar Precision Espresso Machine',
        description: 'Bring the gourmet cafe experience home. Features a powerful steam wand to frothe rich microfoam milk, auto-dosing controls, a high-pressure pump, and an build-in thermo heating system.',
        price: 599.99,
        discountPrice: 489.99,
        category: 'home-kitchen',
        rating: 4.7,
        reviewsCount: 54,
        stock: 5,
        image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80',
        featured: true
    },
    {
        id: 'prod_10',
        name: 'Non-Stick Ceramic Cookware Set',
        description: 'Healthy cooking made easy. This 10-piece set includes saute pans, stockpots, and saucepans with premium ceramic finish. Free from PFOA, PFAS, lead, and cadmium. Oven safe up to 350F.',
        price: 189.99,
        discountPrice: null,
        category: 'home-kitchen',
        rating: 4.4,
        reviewsCount: 93,
        stock: 15,
        image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80',
        featured: false
    },
    {
        id: 'prod_11',
        name: 'Non-Slip High Density Yoga Mat',
        description: 'Eco-conscious design constructed from natural TPE. Featuring double-sided textured grip surfaces to prevent slipping, 6mm premium padding to support joints, and an included carry strap.',
        price: 49.99,
        discountPrice: 39.99,
        category: 'sports',
        rating: 4.6,
        reviewsCount: 112,
        stock: 40,
        image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop&q=80',
        featured: false
    },
    {
        id: 'prod_12',
        name: 'Minimalist Full Grain Leather Wallet',
        description: 'Handstitched from vegetable tanned leather. Sleek design holds up to 8 cards and folded bills in the main pocket. Over time, it will develop a uniquely beautiful patina tailored to your use.',
        price: 55.00,
        discountPrice: null,
        category: 'accessories',
        rating: 4.8,
        reviewsCount: 150,
        stock: 80,
        image: 'https://images.unsplash.com/photo-1627124765135-56c2d77b0d87?w=800&auto=format&fit=crop&q=80',
        featured: true
    }
];

export const INITIAL_USERS = [
    {
        id: 'user_1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'password123',
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    },
    {
        id: 'user_2',
        name: 'John Doe (Admin)',
        email: 'admin@example.com',
        password: 'adminpassword',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
    }
];

export const INITIAL_ORDERS = [
    {
        id: 'ord_1',
        userId: 'user_1',
        customerName: 'Alice Johnson',
        customerEmail: 'alice@example.com',
        items: [
            {
                productId: 'prod_1',
                name: 'Pro Noise-Cancelling Headphones',
                price: 299.99,
                quantity: 1,
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'
            },
            {
                productId: 'prod_12',
                name: 'Minimalist Full Grain Leather Wallet',
                price: 55.00,
                quantity: 2,
                image: 'https://images.unsplash.com/photo-1627124765135-56c2d77b0d87?w=800&auto=format&fit=crop&q=80'
            }
        ],
        totalAmount: 409.99,
        status: 'Delivered',
        paymentMethod: 'Credit Card',
        shippingAddress: '123 Pine St, San Francisco, CA 94103',
        createdAt: '2026-07-06T14:30:00Z'
    },
    {
        id: 'ord_2',
        userId: 'user_1',
        customerName: 'Alice Johnson',
        customerEmail: 'alice@example.com',
        items: [
            {
                productId: 'prod_4',
                name: 'Classic Denim Trucker Jacket',
                price: 69.99,
                quantity: 1,
                image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80'
            }
        ],
        totalAmount: 69.99,
        status: 'Pending',
        paymentMethod: 'PayPal',
        shippingAddress: '123 Pine St, San Francisco, CA 94103',
        createdAt: '2026-07-09T18:45:00Z'
    }
];
