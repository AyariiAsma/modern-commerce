import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

const translations = {
    en: {
        // Nav & General
        home: 'Home',
        catalog: 'Catalog',
        cart: 'Cart',
        profile: 'Profile',
        login: 'Login',
        register: 'Register',
        adminDashboard: 'Admin Control',
        logout: 'Sign Out',
        welcome: 'Welcome',
        backToCatalog: 'Back to Catalog',
        back: 'Back',

        // Home Page
        heroTitle: 'Curated Elegance for Modern Living',
        heroSubtitle: 'Discover premium apparel, modern accessories, and sleek items handpicked for you.',
        shopNow: 'Shop Now',
        featuredProducts: 'Featured Releases',
        browseCategories: 'Browse Categories',
        viewAll: 'View All',

        // Catalog Page
        filters: 'Filters',
        searchPlaceholder: 'Search items...',
        allCategories: 'All Categories',
        priceRange: 'Price Range',
        sortBy: 'Sort By',
        sortDefault: 'Default Sorting',
        sortPriceAsc: 'Price: Low to High',
        sortPriceDesc: 'Price: High to Low',
        sortRating: 'Top Rated',
        resetFilters: 'Reset Filters',
        noProductsFound: 'No Products Found',
        inStock: 'In Stock',
        outOfStock: 'Out of Stock',
        lowStock: 'Low Stock',

        // Product Details
        addToCart: 'Add to Cart',
        quantity: 'Quantity',
        verifiedReviews: 'verified reviews',
        specification: 'Details & Specifications',
        warranty: '1 Year Warranty',
        returns: '30 Day Returns',
        freeDelivery: 'Free Delivery',
        relatedProducts: 'Customers also viewed',

        // Cart Page
        shoppingBag: 'Shopping Bag',
        reviewBag: 'Review items before completing purchase.',
        summary: 'Order Totals',
        appliedPromo: 'Promo Code Applied',
        promoError: 'Invalid or expired coupon code.',
        promoPlaceholder: 'Voucher code...',
        applyCode: 'Apply',
        freeShippingMessage: 'Orders qualify for Free Shipping.',
        estimatedShipping: 'Estimated Shipping',
        subtotal: 'Subtotal',
        netPay: 'Balance Price',
        proceedCheckout: 'Proceed to Checkout',
        emptyCartTitle: 'Your cart is empty',
        emptyCartDesc: 'Looks like you haven\'t added any items to your bag yet.',
        exploreCatalog: 'Explore Catalog',

        // Checkout Page
        shippingSettings: 'Shipping & Delivery Settings',
        deliveryDest: 'Specify destination address for courier delivery.',
        fullName: 'Full Name',
        fullNameReq: 'Full name is required',
        streetAddress: 'Street Address',
        streetAddressReq: 'Street address is required',
        city: 'City',
        cityReq: 'City name is required',
        zipCode: 'Postal / Zip Code',
        zipCodeReq: 'Zip code is required',
        paymentMethod: 'Select Payment Method',
        placeOrder: 'Place Secure Order',
        orderSuccessTitle: 'Order Placed Successfully!',
        orderSuccessDesc: 'Thank you for choosing AURA. We have received your order details and our fulfillment team is preparing it for shipment.',
        orderRef: 'Order Reference',
        totalValue: 'Total Value',
        deliverTo: 'Deliver To',
        viewHistory: 'View Order History',
        continueShopping: 'Continue Shopping',
        createAccountTrack: 'Create an account to track your orders',
        cashOnDelivery: 'Cash on Delivery',
        creditCard: 'Credit Card',
        paypal: 'PayPal',

        // Login & Register
        welcomeBack: 'Welcome Back',
        signInDesc: 'Sign in to experience AURA store dashboard',
        emailAddress: 'Email Address',
        emailReq: 'Email is required',
        emailPattern: 'Invalid email address',
        password: 'Password',
        passwordReq: 'Password is required',
        passwordMin: 'Password must match 6 characters minimum',
        quickLogins: 'Quick Logins (Mock)',
        signIn: 'Sign In',
        noAccount: 'Don\'t have an account?',
        registerHere: 'Register Here',
        createAccount: 'Create Account',
        joinAura: 'Join AURA and explore premium collections.',
        alreadyAccount: 'Already have an account?',
        signUp: 'Sign Up',

        // Profile Page
        adminBadge: 'System Admin',
        memberSince: 'Member since July 2026',
        orderHistory: 'Order History',
        orderHistoryDesc: 'Review status and summaries of previous orders.',
        datePlaced: 'Date Placed',
        noOrdersTitle: 'No orders found',
        noOrdersDesc: 'You haven\'t checked out any orders yet. Place some orders to view history.',

        // Admin Dashboard / General Settings
        adminDashboardTitle: 'Admin Overview',
        adminDashboardDesc: 'Real-time statistics and summary logs of Aura Storefront.',
        totalSalesRev: 'Total Sales Revenue',
        activeOrders: 'Active Orders',
        inventoryItems: 'Active Inventory Items',
        registeredCustomers: 'Registered Customers',
        recentOrdersList: 'Recent Orders List',
        stockLevelCheck: 'Stock Level Check',
        replenishRequired: 'Critical low stocks requiring replenishment.',
        verifyFullInv: 'Verify Full Inventory',
        manageOrders: 'Manage Orders',

        // Admin Products CRUD list
        invProductsTitle: 'Inventory Products Management',
        invProductsDesc: 'Create, update details, adjust stock listings, and assign categories.',
        createProduct: 'Create Product',
        editProduct: 'Update Product Details',
        productTitleLabel: 'Product Title',
        categoryChannel: 'Category Channel',
        stockCountLabel: 'Stock Count',
        retailPrice: 'Retail Price',
        discountPriceLabel: 'Promo Discounted',
        assetUrl: 'Asset Image URL',
        highlightFeatured: 'Highlight as Featured release',
        saveChanges: 'Save Changes',
        publishProduct: 'Publish Product',
        cancel: 'Cancel',

        // Admin Categories CRUD list
        taxoCategoriesTitle: 'Categories Taxonomy Manager',
        taxoCategoriesDesc: 'Manage storefront departments and categorize items.',
        createCategory: 'Create Category',
        editCategory: 'Update Categorization Details',
        deptTitle: 'Department Title',
        visualIcon: 'Visual Theme Icon',
        activateDept: 'Activate Department',
        saveDept: 'Save Department',

        // Admin Orders List
        ordersManagerTitle: 'Orders Manager',
        ordersManagerDesc: 'Verify invoices list, address destinations, and adjust status tracking flow.',
        invoiceDetails: 'Invoice Details',
        invoiceStatus: 'Invoice Status',
        adjustDispatchStatus: 'Adjust dispatch status tracking',
        closeDetails: 'Close details',

        // Settings Configuration Panel
        settingsPanelTitle: 'Store Configuration Settings',
        settingsPanelDesc: 'Configure currency options, delivery charges, and payment requirements globally.',
        activeCurrency: 'Active Currency Symbol / Device',
        shippingCostConfig: 'Shipping Fee Charge / Frais de Livraison',
        cashOnDeliveryOnlyOption: 'Restrict to Cash on Delivery payments only',
        saveSettings: 'Save Settings',
        settingsSavedSuccess: 'Store configuration settings successfully updated.',
    },
    fr: {
        // Nav & General
        home: 'Accueil',
        catalog: 'Catalogue',
        cart: 'Panier',
        profile: 'Profil',
        login: 'Connexion',
        register: 'Inscription',
        adminDashboard: 'Contrôle Admin',
        logout: 'Se Déconnecter',
        welcome: 'Bienvenue',
        backToCatalog: 'Retour au catalogue',
        back: 'Retour',

        // Home Page
        heroTitle: 'Élégance Sélectionnée pour la Vie Moderne',
        heroSubtitle: 'Découvrez des vêtements de qualité supérieure, des accessoires modernes et des articles épurés sélectionnés pour vous.',
        shopNow: 'Acheter Maintenant',
        featuredProducts: 'Nouveautés en Vedette',
        browseCategories: 'Parcourir les Catégories',
        viewAll: 'Voir Tout',

        // Catalog Page
        filters: 'Filtres',
        searchPlaceholder: 'Rechercher des articles...',
        allCategories: 'Toutes les catégories',
        priceRange: 'Gamme de prix',
        sortBy: 'Trier Par',
        sortDefault: 'Tri par défaut',
        sortPriceAsc: 'Prix: du moins cher au plus cher',
        sortPriceDesc: 'Prix: du plus cher au moins cher',
        sortRating: 'Mieux notés',
        resetFilters: 'Réinitialiser les filtres',
        noProductsFound: 'Aucun produit trouvé',
        inStock: 'En stock',
        outOfStock: 'Rupture de stock',
        lowStock: 'Stock faible',

        // Product Details
        addToCart: 'Ajouter au Panier',
        quantity: 'Quantité',
        verifiedReviews: 'avis vérifiés',
        specification: 'Détails & Spécifications',
        warranty: 'Garantie de 1 An',
        returns: 'Retours de 30 Jours',
        freeDelivery: 'Livraison Gratuite',
        relatedProducts: 'Les clients ont également consulté',

        // Cart Page
        shoppingBag: 'Sac d\'Achat',
        reviewBag: 'Vérifiez vos articles avant de finaliser votre commande.',
        summary: 'Totaux de Commande',
        appliedPromo: 'Code Promo Appliqué',
        promoError: 'Code promo invalide ou expiré.',
        promoPlaceholder: 'Code promo...',
        applyCode: 'Appliquer',
        freeShippingMessage: 'Commandes éligibles pour la livraison gratuite.',
        estimatedShipping: 'Frais de Livraison',
        subtotal: 'Sous-total',
        netPay: 'Prix net à payer',
        proceedCheckout: 'Passer à la Caisse',
        emptyCartTitle: 'Votre panier est vide',
        emptyCartDesc: 'Il semble que vous n\'ayez encore ajouté aucun article à votre sac.',
        exploreCatalog: 'Explorer le Catalogue',

        // Checkout Page
        shippingSettings: 'Paramètres de Livraison',
        deliveryDest: 'Précisez l\'adresse de destination pour la livraison.',
        fullName: 'Nom Complet',
        fullNameReq: 'Le nom complet est obligatoire',
        streetAddress: 'Adresse de Rue',
        streetAddressReq: 'L\'adresse est obligatoire',
        city: 'Ville',
        cityReq: 'La ville est obligatoire',
        zipCode: 'Code Postal',
        zipCodeReq: 'Le code postal est obligatoire',
        paymentMethod: 'Sélectionnez le mode de paiement',
        placeOrder: 'Confirmer la Commande Securisée',
        orderSuccessTitle: 'Commande effectuée avec succès !',
        orderSuccessDesc: 'Merci d\'avoir choisi AURA. Nous avons reçu vos détails de commande et notre équipe prépare son expédition.',
        orderRef: 'Référence de Commande',
        totalValue: 'Valeur totale',
        deliverTo: 'Livrer à',
        viewHistory: 'Voir l\'historique des commandes',
        continueShopping: 'Continuer Shopping',
        createAccountTrack: 'Créez un compte pour suivre vos commandes',
        cashOnDelivery: 'Paiement à la livraison',
        creditCard: 'Carte de Crédit',
        paypal: 'PayPal',

        // Login & Register
        welcomeBack: 'Bon Retour',
        signInDesc: 'Connectez-vous pour accéder au tableau de bord AURA',
        emailAddress: 'Adresse Email',
        emailReq: 'L\'email est obligatoire',
        emailPattern: 'Adresse email invalide',
        password: 'Mot de passe',
        passwordReq: 'Le mot de passe est obligatoire',
        passwordMin: 'Le mot de passe doit comporter au moins 6 caractères',
        quickLogins: 'Connexions rapides (Démo)',
        signIn: 'Se Connecter',
        noAccount: 'Vous n\'avez pas de compte ?',
        registerHere: 'Inscrivez-vous ici',
        createAccount: 'Créer un Compte',
        joinAura: 'Rejoignez AURA et découvrez nos collections de premier choix.',
        alreadyAccount: 'Vous avez déjà un compte ?',
        signUp: 'S\'inscrire',

        // Profile Page
        adminBadge: 'Administrateur',
        memberSince: 'Membre depuis Juillet 2026',
        orderHistory: 'Historique des Commandes',
        orderHistoryDesc: 'Consultez le statut et les historiques de vos anciennes commandes.',
        datePlaced: 'Date de Commande',
        noOrdersTitle: 'Aucune commande trouvée',
        noOrdersDesc: 'Vous n\'avez pas encore effectué de commande. Passez des commandes pour afficher l\'historique.',

        // Admin Dashboard / General Settings
        adminDashboardTitle: 'Aperçu Admin',
        adminDashboardDesc: 'Statistiques en temps réel et journaux de la boutique Aura.',
        totalSalesRev: 'Chiffre d\'Affaires Total',
        activeOrders: 'Commandes Actives',
        inventoryItems: 'Articles en Stock',
        registeredCustomers: 'Clients Enregistrés',
        recentOrdersList: 'Commandes Récentes',
        stockLevelCheck: 'Niveau des Stocks',
        replenishRequired: 'Stocks critiques nécessitant un réapprovisionnement.',
        verifyFullInv: 'Vérifier tout l\'inventaire',
        manageOrders: 'Gérer les Commandes',

        // Admin Products CRUD list
        invProductsTitle: 'Gestion de l\'Inventaire des Produits',
        invProductsDesc: 'Créez, modifiez les détails, ajustez les stocks et affectez des catégories.',
        createProduct: 'Créer un Produit',
        editProduct: 'Modifier le Produit',
        productTitleLabel: 'Nom du Produit',
        categoryChannel: 'Catégorie du Produit',
        stockCountLabel: 'Quantité en Stock',
        retailPrice: 'Prix de Vente',
        discountPriceLabel: 'Prix Promotionnel',
        assetUrl: 'URL de l\'image',
        highlightFeatured: 'Produit Vedette',
        saveChanges: 'Enregistrer',
        publishProduct: 'Publier le Produit',
        cancel: 'Annuler',

        // Admin Categories CRUD list
        taxoCategoriesTitle: 'Gestion des Catégories',
        taxoCategoriesDesc: 'Gérez les rayons de la boutique et classez les articles.',
        createCategory: 'Créer une Catégorie',
        editCategory: 'Modifier la Catégorie',
        deptTitle: 'Nom du Rayon',
        visualIcon: 'Icône Thématique',
        activateDept: 'Activer le Rayon',
        saveDept: 'Enregistrer le Rayon',

        // Admin Orders List
        ordersManagerTitle: 'Gestion des Commandes',
        ordersManagerDesc: 'Consultez les factures, les adresses de destination et ajustez le suivi.',
        invoiceDetails: 'Détails de la Facture',
        invoiceStatus: 'Statut de la Facture',
        adjustDispatchStatus: 'Ajuster l\'état et le suivi de livraison',
        closeDetails: 'Fermer les détails',

        // Settings Configuration Panel
        settingsPanelTitle: 'Paramètres de Configuration Globale',
        settingsPanelDesc: 'Configurez la devise, les frais de livraison et les modes de paiement actifs.',
        activeCurrency: 'Symbole de la Devise Active',
        shippingCostConfig: 'Frais de Livraison',
        cashOnDeliveryOnlyOption: 'Restreindre uniquement au Paiement à la Livraison',
        saveSettings: 'Enregistrer les Paramètres',
        settingsSavedSuccess: 'Paramètres mis à jour avec succès.',
    },
    ar: {
        // Nav & General
        home: 'الرئيسية',
        catalog: 'المنتجات',
        cart: 'السلة',
        profile: 'الملف الشخصي',
        login: 'تسجيل الدخول',
        register: 'إنشاء حساب',
        adminDashboard: 'لوحة التحكم',
        logout: 'تسجيل الخروج',
        welcome: 'مرحباً',
        backToCatalog: 'العودة إلى المعرض',
        back: 'رجوع',

        // Home Page
        heroTitle: 'أناقة منسقة للحياة العصرية',
        heroSubtitle: 'اكتشف ملابس فاخرة وإكسسوارات عصرية وقطعاً أنيقة تم اختيارها خصيصاً لك.',
        shopNow: 'تسوق الآن',
        featuredProducts: 'الإصدارات المميزة',
        browseCategories: 'تصفح الفئات',
        viewAll: 'عرض الكل',

        // Catalog Page
        filters: 'فلاتر التصفية',
        searchPlaceholder: 'ابحث عن منتج...',
        allCategories: 'جميع الفئات',
        priceRange: 'نطاق السعر',
        sortBy: 'ترتيب حسب',
        sortDefault: 'الترتيب الافتراضي',
        sortPriceAsc: 'السعر: من الأقل إلى الأعلى',
        sortPriceDesc: 'السعر: من الأعلى إلى الأقل',
        sortRating: 'الأعلى تقييماً',
        resetFilters: 'إعادة تعيين الفلاتر',
        noProductsFound: 'لم يتم العثور على منتجات',
        inStock: 'متوفر في المخزن',
        outOfStock: 'نفذ من المخزن',
        lowStock: 'كمية محدودة',

        // Product Details
        addToCart: 'إضافة إلى السلة',
        quantity: 'الكمية',
        verifiedReviews: 'تقييمات موثقة',
        specification: 'التفاصيل والمواصفات',
        warranty: 'ضمان لمدة سنة واحدة',
        returns: 'إرجاع مجاني خلال 30 يوماً',
        freeDelivery: 'شحن مجاني',
        relatedProducts: 'تصفح أيضاً',

        // Cart Page
        shoppingBag: 'سلة المشتريات',
        reviewBag: 'مراجعة المنتجات قبل إتمام عملية الشراء.',
        summary: 'إجمالي الطلب',
        appliedPromo: 'تم تطبيق الكود الترويجي',
        promoError: 'كود الخصم غير صالح أو منتهي الصلاحية.',
        promoPlaceholder: 'كود الخصم...',
        applyCode: 'تطبيق',
        freeShippingMessage: 'الطلبات مؤهلة للشحن المجاني.',
        estimatedShipping: 'فرايز دي ليفريزون (شحن)',
        subtotal: 'المجموع الفرعي',
        netPay: 'السعر الإجمالي المطلوب',
        proceedCheckout: 'متابعة الشراء',
        emptyCartTitle: 'السلة فارغة',
        emptyCartDesc: 'يبدو أنك لم تقم بإضافة أي منتجات إلى سلة المشتريات بعد.',
        exploreCatalog: 'تصفح المنتجات المعروضة',

        // Checkout Page
        shippingSettings: 'إعدادات الشحن والتوصيل',
        deliveryDest: 'حدد عنوان التوصيل لإرسال الطلبية.',
        fullName: 'الاسم الكامل',
        fullNameReq: 'الاسم الكامل مطلوب',
        streetAddress: 'العنوان بالتفصيل',
        streetAddressReq: 'العنوان مطلوب',
        city: 'المدينة',
        cityReq: 'اسم المدينة مطلوب',
        zipCode: 'الرمز البريدي',
        zipCodeReq: 'الرمز البريدي مطلوب',
        paymentMethod: 'اختر طريقة الدفع',
        placeOrder: 'تأكيد الطلب المحمي',
        orderSuccessTitle: 'تم إرسال الطلبية بنجاح !',
        orderSuccessDesc: 'نشكرك على اختيارك AURA. لقد استلمنا تفاصيل طلبك ويقوم فريق التنفيذ لدينا بإعداده للشحن حالياً.',
        orderRef: 'رقم المرجعية للطلب',
        totalValue: 'القيمة الإجمالية',
        deliverTo: 'التسليم إلى',
        viewHistory: 'تاريخ طلباتي',
        continueShopping: 'مواصلة التسوق',
        createAccountTrack: 'أنشئ حساباً لتعقب طلبياتك ومشترياتك',
        cashOnDelivery: 'الدفع عند التوصيل',
        creditCard: 'بطاقة ائتمان',
        paypal: 'باي بال',

        // Login & Register
        welcomeBack: 'مرحباً بعودتك',
        signInDesc: 'قم بتسجيل الدخول للوصول إلى لوحة AURA',
        emailAddress: 'البريد الإلكتروني',
        emailReq: 'البريد الإلكتروني مطلوب',
        emailPattern: 'البريد الإلكتروني غير صحيح',
        password: 'كلمة المرور',
        passwordReq: 'كلمة المرور مطلوبة',
        passwordMin: 'يجب ألا تقل كلمة المرور عن 6 أحرف',
        quickLogins: 'دخول سريع (تجريبي)',
        signIn: 'تسجيل الدخول',
        noAccount: 'ليس لديك حساب؟',
        registerHere: 'سجّل هنا',
        createAccount: 'إنشاء حساب جديد',
        joinAura: 'انضم لـ AURA وتصفح مجموعتنا الفاخرة.',
        alreadyAccount: 'لديك حساب بالفعل؟',
        signUp: 'تسجيل',

        // Profile Page
        adminBadge: 'مدير النظام',
        memberSince: 'عضو منذ يوليو 2026',
        orderHistory: 'سجل الطلبات',
        orderHistoryDesc: 'مراجعة وتتبع الطلبيات السابقة وحالتها.',
        datePlaced: 'تاريخ الطلب',
        noOrdersTitle: 'لا توجد طلبات سابقة',
        noOrdersDesc: 'لم تقم بتقديم أي طلبيات بعد. تسوق الآن لتسجيل طلباتك هنا.',

        // Admin Dashboard / General Settings
        adminDashboardTitle: 'لوحة تحكم المدير',
        adminDashboardDesc: 'إحصائيات الطلبيات والسلع والمبيعات المباشرة.',
        totalSalesRev: 'إجمالي المبيعات والواردات',
        activeOrders: 'الطلبات النشطة والجديدة',
        inventoryItems: 'عدد السلع في المخزن',
        registeredCustomers: 'العملاء المسجلون',
        recentOrdersList: 'قائمة الطلبات الأخيرة المستلمة',
        stockLevelCheck: 'فحص مخزون السلع',
        replenishRequired: 'السلع التي قاربت على النفاد وتطلب تزويداً للمخزن.',
        verifyFullInv: 'مراجعة المخزون الكامل',
        manageOrders: 'إدارة الطلبات',

        // Admin Products CRUD list
        invProductsTitle: 'إدارة المنتجات والمخزون',
        invProductsDesc: 'إضافة منتجات جديدة، تعديل تفاصيلها، مراقبة الكمية وتحرير التصنيف.',
        createProduct: 'إضافة منتج جديد',
        editProduct: 'تحديث تفاصيل المنتج',
        productTitleLabel: 'اسم المنتج',
        categoryChannel: 'تصنيف المنتج',
        stockCountLabel: 'الكمية المتوفرة',
        retailPrice: 'السعر بالمفرد',
        discountPriceLabel: 'السعر الترويجي المخصوم',
        assetUrl: 'رابط صورة المنتج',
        highlightFeatured: 'تمييز كمنتج فاخر في الواجهة الرئيسية',
        saveChanges: 'حفظ التعديلات',
        publishProduct: 'نشر المنتج في المتجر',
        cancel: 'إلغاء',

        // Admin Categories CRUD list
        taxoCategoriesTitle: 'إدارة التصنيفات والفئات',
        taxoCategoriesDesc: 'التحكم بأقسام المتجر الرئيسية وفصل المنتجات.',
        createCategory: 'إضافة قسم جديد',
        editCategory: 'تعديل وثائق القسم',
        deptTitle: 'اسم القسم',
        visualIcon: 'الأيقونة التوضيحية للقسم',
        activateDept: 'تنشيط وإضافة القسم',
        saveDept: 'حفظ معلومات القسم',

        // Admin Orders List
        ordersManagerTitle: 'مدير الفواتير والطلبات',
        ordersManagerDesc: 'مراجعة المشتريات، عناوين التسليم وتعديل حالة شحن الطرود.',
        invoiceDetails: 'تفاصيل الفاتورة والطرود',
        invoiceStatus: 'حالة الطلبية حالياً',
        adjustDispatchStatus: 'تعديل وتوجيه حالة الشحن للعميل',
        closeDetails: 'إغلاق التفاصيل',

        // Settings Configuration Panel
        settingsPanelTitle: 'إعدادات المتجر العامة',
        settingsPanelDesc: 'تعديل عملة المتجر، تكاليف الشحن (frais de livraison) وتفعيل طريقة الشحن الحصرية.',
        activeCurrency: 'الرمز المميز للعملة النشطة',
        shippingCostConfig: 'تكاليف ومصاريف الشحن والتوصيل',
        cashOnDeliveryOnlyOption: 'حصر المبيعات بطريقة الدفع عند الاستلام فقط (COD)',
        saveSettings: 'حفظ الإعدادات',
        settingsSavedSuccess: 'تم تحديث إعدادات المتجر والنظام بنجاح.',
    }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('ecomm_language');
        return saved || 'en';
    });

    useEffect(() => {
        localStorage.setItem('ecomm_language', language);
        // RTL support: set document elements direction
        const isRtl = language === 'ar';
        document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
    }, [language]);

    const t = (key) => {
        return translations[language]?.[key] || translations['en']?.[key] || key;
    };

    const isRtl = language === 'ar';

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
            {children}
        </LanguageContext.Provider>
    );
};
