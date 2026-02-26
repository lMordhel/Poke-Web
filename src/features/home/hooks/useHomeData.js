import { useState, useEffect } from 'react';
import { homeService } from '../services/home.service';

export const useHomeData = () => {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [stats, setStats] = useState(null);
    const [bestSeller, setBestSeller] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await homeService.getHomeData();

                if (isMounted && data) {
                    setFeaturedProducts(data.featuredProducts || []);
                    setStats(data.stats || null);
                    setBestSeller(data.bestSeller || null);
                }
            } catch (err) {
                console.error("Error fetching home data:", err);
                if (isMounted) {
                    setError(err.message || 'Failed to load home data');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, []);

    return {
        featuredProducts,
        stats,
        bestSeller,
        loading,
        error
    };
};
