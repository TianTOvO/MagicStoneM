import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** Market has been merged into ShopPage — redirect. */
export default function MarketPage() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/shop', { replace: true }); }, [navigate]);
  return null;
}
