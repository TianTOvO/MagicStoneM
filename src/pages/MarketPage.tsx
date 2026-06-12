import { useContext, useState, useEffect, useCallback } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { TOOL_LEVEL_NAMES, getStoneDisplayName } from '@/types';
import type { MarketListing, MarketOffer, AuctionInfo } from '@/types';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { createDemoListings, createDemoOffers, createDemoAuctions, DEMO_MY_STONES, DEMO_MY_TOOLS, type DemoListing, type DemoOffer, type DemoAuction } from '@/data/demoMarket';

export default function MarketPage() {
  const { userData, updateUserData } = useContext(UserDataContext);
  const [activeTab, setActiveTab] = useState<'all' | 'stones' | 'tools' | 'myListings' | 'offers' | 'auctions'>('all');

  // Demo state
  const [demoListings, setDemoListings] = useState<DemoListing[]>([]);
  const [demoOffers, setDemoOffers] = useState<DemoOffer[]>([]);
  const [demoAuctions, setDemoAuctions] = useState<DemoAuction[]>([]);
  const [demoCoins, setDemoCoins] = useState(5000);
  const [demoMyStones, setDemoMyStones] = useState(DEMO_MY_STONES);
  const [demoMyTools, setDemoMyTools] = useState(DEMO_MY_TOOLS);

  // Sell modal
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellItem, setSellItem] = useState<{ isStone: boolean; tokenId: number } | null>(null);
  const [sellPrice, setSellPrice] = useState('');

  // Buy modal
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<DemoListing | null>(null);

  // Offer modal
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerTarget, setOfferTarget] = useState<{ isStone: boolean; tokenId: number } | null>(null);
  const [offerPrice, setOfferPrice] = useState('');

  // Offer tabs
  const [offerSubTab, setOfferSubTab] = useState<'incoming' | 'outgoing'>('incoming');

  // Auction state
  const [auctionSubTab, setAuctionSubTab] = useState<'active' | 'ended'>('active');
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [auctionItem, setAuctionItem] = useState<{ isStone: boolean; tokenId: number } | null>(null);
  const [auctionStartPrice, setAuctionStartPrice] = useState('');
  const [auctionMinIncrement, setAuctionMinIncrement] = useState('');
  const [auctionDuration, setAuctionDuration] = useState('3600');
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidTarget, setBidTarget] = useState<DemoAuction | AuctionInfo | null>(null);
  const [bidAmount, setBidAmount] = useState('');

  useEffect(() => {
    setDemoListings(createDemoListings());
    setDemoOffers(createDemoOffers());
    setDemoAuctions(createDemoAuctions());
    setDemoCoins(5000);
  }, []);

  const DEMO_ADDR = '0xPlayer1';
  const myAddr = DEMO_ADDR;

  const filteredItems = demoListings.filter(item => {
    if (activeTab === 'stones' && !item.isStone) return false;
    if (activeTab === 'tools' && item.isStone) return false;
    if (activeTab === 'myListings' && item.seller !== myAddr) return false;
    return true;
  });

  const visibleOffers = demoOffers;
  const visibleAuctions = demoAuctions;

  const handleSell = () => {
    if (!sellItem || !sellPrice) return;
    const price = parseInt(sellPrice);
    if (isNaN(price) || price <= 0) { toast.error('请输入有效价格'); return; }
    setDemoListings(prev => [...prev, {
      isStone: sellItem.isStone, tokenId: sellItem.tokenId, seller: DEMO_ADDR, price,
      grade: sellItem.isStone ? 0 : undefined, level: sellItem.isStone ? undefined : 0,
    }]);
    if (sellItem.isStone) setDemoMyStones(prev => prev.filter(s => s.id !== sellItem.tokenId));
    else setDemoMyTools(prev => prev.filter(t => t.id !== sellItem.tokenId));
    toast.success('上架成功');
    setShowSellModal(false); setSellItem(null); setSellPrice('');
  };

  const handleBuy = () => {
    if (!selectedListing) return;
    setDemoCoins(c => c - selectedListing.price);
    setDemoListings(prev => prev.filter(l => !(l.isStone === selectedListing.isStone && l.tokenId === selectedListing.tokenId)));
    toast.success('购买成功');
    setShowBuyModal(false); setSelectedListing(null);
  };

  const handleDelist = (isStone: boolean, tokenId: number) => {
    setDemoListings(prev => prev.filter(l => !(l.isStone === isStone && l.tokenId === tokenId)));
    toast.success('已下架');
  };

  const handleMakeOffer = () => {
    if (!offerTarget || !offerPrice) return;
    const price = parseInt(offerPrice);
    if (isNaN(price) || price <= 0) { toast.error('请输入有效出价'); return; }
    setDemoCoins(c => c - price);
    setDemoOffers(prev => [...prev, { isStone: offerTarget.isStone, tokenId: offerTarget.tokenId, buyer: DEMO_ADDR, price }]);
    toast.success('出价成功');
    setShowOfferModal(false); setOfferTarget(null); setOfferPrice('');
  };

  const handleAcceptOffer = (isStone: boolean, tokenId: number, buyer: string) => {
    const offer = demoOffers.find(o => o.buyer === buyer && o.isStone === isStone && o.tokenId === tokenId);
    if (offer) setDemoCoins(c => c + offer.price);
    setDemoOffers(prev => prev.filter(o => !(o.buyer === buyer && o.isStone === isStone && o.tokenId === tokenId)));
    toast.success('已接受出价，交易完成');
  };

  const handleCancelOffer = (isStone: boolean, tokenId: number) => {
    const offer = demoOffers.find(o => o.isStone === isStone && o.tokenId === tokenId);
    if (offer) setDemoCoins(c => c + offer.price);
    setDemoOffers(prev => prev.filter(o => !(o.isStone === isStone && o.tokenId === tokenId)));
    toast.success('出价已撤回');
  };

  const handleStartAuction = () => {
    if (!auctionItem || !auctionStartPrice || !auctionMinIncrement) return;
    const now = Math.floor(Date.now() / 1000);
    setDemoAuctions(prev => [...prev, {
      isStone: auctionItem.isStone, tokenId: auctionItem.tokenId, seller: DEMO_ADDR,
      startPrice: parseInt(auctionStartPrice), minBidIncrement: parseInt(auctionMinIncrement),
      endTime: now + parseInt(auctionDuration), highestBidder: '', highestBid: 0, active: true,
    }]);
    if (auctionItem.isStone) setDemoMyStones(prev => prev.filter(s => s.id !== auctionItem.tokenId));
    else setDemoMyTools(prev => prev.filter(t => t.id !== auctionItem.tokenId));
    toast.success('拍卖已创建');
    setShowAuctionModal(false); setAuctionItem(null); setAuctionStartPrice(''); setAuctionMinIncrement(''); setAuctionDuration('3600');
  };

  const handleBid = () => {
    if (!bidTarget || !bidAmount) return;
    const amount = parseInt(bidAmount);
    if (isNaN(amount) || amount <= 0) { toast.error('请输入有效出价'); return; }
    setDemoCoins(c => c - amount);
    setDemoAuctions(prev => prev.map(a => {
      if (a.isStone === bidTarget.isStone && a.tokenId === bidTarget.tokenId) {
        return { ...a, highestBidder: DEMO_ADDR, highestBid: amount };
      }
      return a;
    }));
    toast.success('出价成功');
    setShowBidModal(false); setBidTarget(null); setBidAmount('');
  };

  const handleSettleAuction = (isStone: boolean, tokenId: number) => {
    const a = demoAuctions.find(x => x.isStone === isStone && x.tokenId === tokenId);
    if (a && a.highestBidder) setDemoCoins(c => c + a.highestBid - Math.floor(a.highestBid * 0.025));
    setDemoAuctions(prev => prev.filter(x => !(x.isStone === isStone && x.tokenId === tokenId)));
    toast.success('拍卖已结算');
  };

  const handleCancelAuction = (isStone: boolean, tokenId: number) => {
    setDemoAuctions(prev => prev.filter(a => !(a.isStone === isStone && a.tokenId === tokenId)));
    toast.success('拍卖已取消');
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-cyan-50 via-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200 shadow-xl"
      >
        <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600">交易所</h1>
        <p className="text-gray-700 text-lg font-medium">自由买卖矿石和工具 · 挂单、出价、即时成交</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="bg-amber-100 border border-amber-400 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
            <i className="fas fa-flask mr-1"></i>本地模式
          </span>
          <span className="ml-auto flex items-center bg-yellow-50 border border-yellow-300 rounded-full px-3 py-1">
            <i className="fas fa-coins text-yellow-500 text-xs mr-1"></i>
            <span className="text-sm font-bold text-yellow-700">{demoCoins} 币</span>
          </span>
        </div>
      </motion.div>

      {/* Tabs & Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border-2 border-blue-300 shadow-lg">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {([
              { key: 'all' as const, label: '全部' },
              { key: 'stones' as const, label: '矿石' },
              { key: 'tools' as const, label: '工具' },
              { key: 'myListings' as const, label: '我的挂单' },
              { key: 'offers' as const, label: '出价管理' },
              { key: 'auctions' as const, label: '拍卖' },
            ]).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.key ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' : 'text-gray-700 hover:text-blue-600'
                }`}
              >{tab.label}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setOfferTarget({ isStone: true, tokenId: 0 }); setShowOfferModal(true); }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold hover:scale-105 transition-all"
            >发起出价</button>
            <button onClick={() => setShowSellModal(true)}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-bold hover:scale-105 transition-all"
            >上架 NFT</button>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      {activeTab !== 'offers' && activeTab !== 'auctions' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black text-gray-800 flex items-center">
              <i className="fas fa-store text-blue-600 mr-2"></i>
              {activeTab === 'myListings' ? '我的挂单' : '市场挂单'}
            </h2>
            <span className="text-gray-600 text-sm font-semibold bg-blue-50 px-3 py-1 rounded-full border border-blue-300">
              共 {filteredItems.length} 件
            </span>
          </div>

          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map(item => (
                <motion.div key={`${item.isStone}-${item.tokenId}`}
                  className="rounded-2xl overflow-hidden border-2 shadow-lg bg-gradient-to-br from-white to-blue-50 border-blue-300 hover:border-blue-500 hover:scale-105 hover:-translate-y-1.5 transition-all duration-150"
                >
                  <div className={`relative h-32 flex items-center justify-center ${
                    item.isStone ? 'bg-gradient-to-br from-blue-50 to-purple-50' : 'bg-gradient-to-br from-green-50 to-emerald-50'
                  }`}>
                    <div className={`absolute inset-0 rounded-full ${item.isStone ? 'bg-blue-400' : 'bg-green-400'} opacity-20 blur-xl`} />
                    <i className={`fas ${item.isStone ? 'fa-gem' : 'fa-wrench'} text-6xl text-white relative drop-shadow-lg`} />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-800">
                        {item.isStone ? '矿石' : '工具'} #{item.tokenId}
                      </h3>
                      <div className="flex items-center bg-yellow-100 border border-yellow-400 rounded-lg px-2 py-0.5">
                        <i className="fas fa-coins text-yellow-600 text-xs mr-1"></i>
                        <span className="font-bold text-yellow-700">{item.price}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 truncate">卖家: {item.seller}</p>
                    {activeTab === 'myListings' ? (
                      <button onClick={() => handleDelist(item.isStone, item.tokenId)}
                        className="w-full py-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg text-white text-sm font-bold hover:scale-105 transition-all"
                      >下架</button>
                    ) : (
                      <button onClick={() => { setSelectedListing(item); setShowBuyModal(true); }}
                        disabled={item.seller === myAddr}
                        className={`w-full py-2 rounded-lg text-white text-sm font-bold transition-all ${
                          item.seller === myAddr ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 shadow-lg'
                        }`}
                      >{item.seller === myAddr ? '自己的挂单' : '立即购买'}</button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-12 border-2 border-blue-300 flex flex-col items-center justify-center min-h-[200px] shadow-lg">
              <i className="fas fa-store-slash text-5xl text-blue-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-1">暂无挂单</h3>
              <p className="text-gray-500 text-sm">成为第一个上架 NFT 的人吧</p>
            </div>
          )}
        </div>
      )}

      {/* Offers Tab */}
      {activeTab === 'offers' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black text-gray-800 flex items-center">
              <i className="fas fa-hand-holding-usd text-amber-600 mr-2"></i>出价管理
            </h2>
            <div className="flex gap-1 bg-amber-100 rounded-xl p-1 border border-amber-300">
              <button onClick={() => setOfferSubTab('incoming')}
                className={`px-3 py-1 rounded-lg text-sm font-bold ${offerSubTab === 'incoming' ? 'bg-amber-500 text-white' : 'text-gray-700'}`}
              >收到的出价</button>
              <button onClick={() => setOfferSubTab('outgoing')}
                className={`px-3 py-1 rounded-lg text-sm font-bold ${offerSubTab === 'outgoing' ? 'bg-amber-500 text-white' : 'text-gray-700'}`}
              >我的出价</button>
            </div>
          </div>
          {offerSubTab === 'incoming' ? (
            visibleOffers.length > 0 ? (
              <div className="space-y-3">
                {visibleOffers.map(o => (
                  <div key={`${o.buyer}-${o.isStone}-${o.tokenId}`}
                    className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-200 flex items-center justify-between shadow">
                    <div className="flex items-center gap-3">
                      <i className={`fas ${o.isStone ? 'fa-gem text-blue-500' : 'fa-wrench text-green-500'} text-2xl`} />
                      <div>
                        <h4 className="font-bold text-gray-800">{o.isStone ? '矿石' : '工具'} #{o.tokenId}</h4>
                        <p className="text-sm text-gray-600">买家: {o.buyer}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-amber-700">{o.price} 币</span>
                      <button onClick={() => handleAcceptOffer(o.isStone, o.tokenId, o.buyer)}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-bold text-sm hover:scale-105 transition-all shadow"
                      >接受出价</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-12 border-2 border-amber-200 flex flex-col items-center min-h-[200px] shadow">
                <i className="fas fa-inbox text-4xl text-amber-300 mb-3" />
                <h3 className="text-lg font-bold text-gray-700">暂无收到出价</h3>
              </div>
            )
          ) : (
            (() => {
              const myOffers = visibleOffers.filter(o => o.buyer === myAddr);
              return myOffers.length > 0 ? (
                <div className="space-y-3">
                  {myOffers.map(o => (
                    <div key={`my-${o.isStone}-${o.tokenId}`}
                      className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200 flex items-center justify-between shadow">
                      <div className="flex items-center gap-3">
                        <i className={`fas ${o.isStone ? 'fa-gem text-blue-500' : 'fa-wrench text-green-500'} text-2xl`} />
                        <div>
                          <h4 className="font-bold text-gray-800">{o.isStone ? '矿石' : '工具'} #{o.tokenId}</h4>
                          <p className="text-sm text-gray-500">等待卖家接受</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-blue-700">{o.price} 币</span>
                        <button onClick={() => handleCancelOffer(o.isStone, o.tokenId)}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg font-bold text-sm hover:scale-105 transition-all shadow"
                        >撤退出价</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-12 border-2 border-blue-200 flex flex-col items-center min-h-[200px] shadow">
                  <i className="fas fa-paper-plane text-4xl text-blue-300 mb-3" />
                  <h3 className="text-lg font-bold text-gray-700">暂无进行中的出价</h3>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* Auction Tab */}
      {activeTab === 'auctions' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black text-gray-800 flex items-center">
              <i className="fas fa-gavel text-purple-600 mr-2"></i>拍卖大厅
            </h2>
            <div className="flex gap-2 items-center">
              <div className="flex gap-1 bg-purple-100 rounded-xl p-1 border border-purple-300">
                <button onClick={() => setAuctionSubTab('active')}
                  className={`px-3 py-1 rounded-lg text-sm font-bold ${auctionSubTab === 'active' ? 'bg-purple-500 text-white' : 'text-gray-700'}`}
                >进行中</button>
                <button onClick={() => setAuctionSubTab('ended')}
                  className={`px-3 py-1 rounded-lg text-sm font-bold ${auctionSubTab === 'ended' ? 'bg-purple-500 text-white' : 'text-gray-700'}`}
                >已结束</button>
              </div>
              <button onClick={() => setShowAuctionModal(true)}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold hover:scale-105 transition-all shadow"
              >发起拍卖</button>
            </div>
          </div>

          {auctionSubTab === 'active' ? (
            visibleAuctions.filter(a => a.active && a.endTime > Date.now() / 1000).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleAuctions.filter(a => a.active && a.endTime > Date.now() / 1000).map(a => {
                  const timeLeft = a.endTime - Math.floor(Date.now() / 1000);
                  const hours = Math.floor(timeLeft / 3600);
                  const mins = Math.floor((timeLeft % 3600) / 60);
                  const secs = timeLeft % 60;
                  const minNextBid = a.highestBidder === '' ? a.startPrice : a.highestBid + a.minBidIncrement;
                  return (
                    <motion.div key={`${a.isStone}-${a.tokenId}`}
                      className="rounded-2xl overflow-hidden border-2 shadow-lg bg-gradient-to-br from-white to-purple-50 border-purple-300 hover:scale-105 transition-all"
                    >
                      <div className="bg-gradient-to-br from-purple-100 to-pink-100 h-28 flex items-center justify-center">
                        <i className={`fas ${a.isStone ? 'fa-gem text-blue-500' : 'fa-wrench text-green-500'} text-5xl`} />
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-bold text-gray-800">{a.isStone ? '矿石' : '工具'} #{a.tokenId}</h3>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>
                            {timeLeft > 0 ? `${hours}h ${mins}m ${secs}s` : '已结束'}
                          </span>
                        </div>
                        <div className="text-sm space-y-1 mb-3">
                          <div className="flex justify-between"><span className="text-gray-600">起拍价</span><span className="font-bold">{a.startPrice}</span></div>
                          <div className="flex justify-between"><span className="text-gray-600">当前出价</span><span className="font-bold text-purple-700">{a.highestBidder === '' ? '暂无' : a.highestBid}</span></div>
                          <div className="flex justify-between"><span className="text-gray-600">下一口价</span><span className="font-bold text-amber-600">{minNextBid}</span></div>
                        </div>
                        {a.seller === myAddr ? (
                          <button onClick={() => handleCancelAuction(a.isStone, a.tokenId)}
                            className="w-full py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg font-bold text-sm"
                          >取消拍卖</button>
                        ) : (
                          <button onClick={() => { setBidTarget(a); setBidAmount(String(minNextBid)); setShowBidModal(true); }}
                            className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-sm hover:scale-105 transition-all"
                          >出价</button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-12 border-2 border-purple-200 flex flex-col items-center min-h-[200px] shadow">
                <i className="fas fa-gavel text-4xl text-purple-300 mb-3" />
                <h3 className="text-lg font-bold text-gray-700 mb-1">暂无进行中的拍卖</h3>
                <p className="text-gray-500 text-sm">发起一场拍卖来出售你的 NFT</p>
              </div>
            )
          ) : (
            (() => {
              const ended = visibleAuctions.filter(a => a.active && a.endTime <= Date.now() / 1000);
              return ended.length > 0 ? (
                <div className="space-y-3">
                  {ended.map(a => (
                    <div key={`end-${a.isStone}-${a.tokenId}`}
                      className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200 flex items-center justify-between shadow">
                      <div className="flex items-center gap-3">
                        <i className={`fas ${a.isStone ? 'fa-gem text-blue-500' : 'fa-wrench text-green-500'} text-2xl`} />
                        <div>
                          <h4 className="font-bold text-gray-800">{a.isStone ? '矿石' : '工具'} #{a.tokenId}</h4>
                          <p className="text-sm text-gray-600">
                            {a.highestBidder === '' ? '无出价 · NFT 将退还给卖家' : `成交价: ${a.highestBid}`}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => handleSettleAuction(a.isStone, a.tokenId)}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-bold text-sm hover:scale-105 transition-all shadow"
                      >结算</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-12 border-2 border-purple-200 flex flex-col items-center min-h-[200px] shadow">
                  <i className="fas fa-check-circle text-4xl text-purple-300 mb-3" />
                  <h3 className="text-lg font-bold text-gray-700 mb-1">没有待结算的拍卖</h3>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* Sell Modal */}
      {showSellModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => { setShowSellModal(false); setSellItem(null); }}
        >
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 max-w-md w-full border-2 border-blue-300 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-4">上架 NFT</h3>
            <div className="space-y-3 mb-4">
              <h4 className="font-bold text-gray-700">你的矿石:</h4>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {demoMyStones.length === 0 && <span className="text-gray-400 text-sm">暂无矿石</span>}
                {demoMyStones.map(s => (
                  <button key={s.id} onClick={() => setSellItem({ isStone: true, tokenId: s.id })}
                    className={`px-3 py-1 rounded-lg text-sm font-bold border-2 transition-all ${
                      sellItem?.isStone && sellItem.tokenId === s.id ? 'border-blue-600 bg-blue-100 text-blue-700' : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >矿石 #{s.id} ({s.name})</button>
                ))}
              </div>
              <h4 className="font-bold text-gray-700 mt-4">你的工具:</h4>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {demoMyTools.length === 0 && <span className="text-gray-400 text-sm">暂无工具</span>}
                {demoMyTools.map(t => (
                  <button key={t.id} onClick={() => setSellItem({ isStone: false, tokenId: t.id })}
                    className={`px-3 py-1 rounded-lg text-sm font-bold border-2 transition-all ${
                      sellItem && !sellItem.isStone && sellItem.tokenId === t.id ? 'border-blue-600 bg-blue-100 text-blue-700' : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >工具 #{t.id} ({t.name})</button>
                ))}
              </div>
            </div>
            {sellItem && (
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">价格 (币)</label>
                <input type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value)}
                  placeholder="输入价格" min="1" className="w-full border-2 border-blue-300 rounded-xl px-4 py-2 text-gray-800" />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setShowSellModal(false); setSellItem(null); }} className="flex-1 py-3 bg-gray-300 rounded-xl font-bold">取消</button>
              <button onClick={handleSell} disabled={!sellItem || !sellPrice} className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-white font-bold shadow-lg disabled:opacity-50">确认上架</button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Buy Modal */}
      {showBuyModal && selectedListing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowBuyModal(false)}
        >
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 max-w-md w-full border-2 border-blue-300 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-4">确认购买</h3>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-4 border border-blue-300">
              <div className="flex items-center gap-4">
                <i className={`fas ${selectedListing.isStone ? 'fa-gem' : 'fa-wrench'} text-3xl`} />
                <div>
                  <h4 className="text-lg font-bold text-gray-800">{selectedListing.isStone ? '矿石' : '工具'} #{selectedListing.tokenId}</h4>
                  <p className="text-gray-600 text-sm">卖家: {selectedListing.seller}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between text-lg mb-4">
              <span className="text-gray-700 font-semibold">价格</span>
              <span className="font-bold flex items-center text-yellow-700">{selectedListing.price} 币</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowBuyModal(false)} className="flex-1 py-3 bg-gray-300 rounded-xl font-bold">取消</button>
              <button onClick={handleBuy} className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-white font-bold shadow-lg">确认购买</button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Offer Modal */}
      {showOfferModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => { setShowOfferModal(false); setOfferTarget(null); }}
        >
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="bg-gradient-to-br from-white to-amber-50 rounded-2xl p-6 max-w-md w-full border-2 border-amber-300 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-4">发起出价</h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">类型</label>
                <select value={offerTarget?.isStone ? 'stone' : 'tool'}
                  onChange={e => setOfferTarget({ isStone: e.target.value === 'stone', tokenId: 0 })}
                  className="w-full border-2 border-amber-300 rounded-xl px-4 py-2 text-gray-800"
                ><option value="stone">矿石</option><option value="tool">工具</option></select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Token ID</label>
                <input type="number" value={offerTarget?.tokenId || ''}
                  onChange={e => setOfferTarget(prev => prev ? { ...prev, tokenId: parseInt(e.target.value) || 0 } : { isStone: true, tokenId: parseInt(e.target.value) || 0 })}
                  className="w-full border-2 border-amber-300 rounded-xl px-4 py-2 text-gray-800" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">出价 (币)</label>
                <input type="number" value={offerPrice} onChange={e => setOfferPrice(e.target.value)}
                  className="w-full border-2 border-amber-300 rounded-xl px-4 py-2 text-gray-800" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowOfferModal(false); setOfferTarget(null); }} className="flex-1 py-3 bg-gray-300 rounded-xl font-bold">取消</button>
              <button onClick={handleMakeOffer} disabled={!offerTarget?.tokenId || !offerPrice} className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-bold shadow-lg disabled:opacity-50">确认出价</button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Auction Start Modal */}
      {showAuctionModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowAuctionModal(false)}
        >
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-6 max-w-md w-full border-2 border-purple-300 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-4">发起拍卖</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">类型</label>
                <select value={auctionItem?.isStone ? 'stone' : 'tool'}
                  onChange={e => setAuctionItem({ isStone: e.target.value === 'stone', tokenId: 0 })}
                  className="w-full border-2 border-purple-300 rounded-xl px-4 py-2"
                ><option value="stone">矿石</option><option value="tool">工具</option></select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Token ID</label>
                <input type="number" value={auctionItem?.tokenId || ''}
                  onChange={e => setAuctionItem(prev => prev ? { ...prev, tokenId: parseInt(e.target.value) || 0 } : { isStone: true, tokenId: parseInt(e.target.value) || 0 })}
                  className="w-full border-2 border-purple-300 rounded-xl px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">起拍价</label>
                <input type="number" value={auctionStartPrice} onChange={e => setAuctionStartPrice(e.target.value)}
                  className="w-full border-2 border-purple-300 rounded-xl px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">最低加价</label>
                <input type="number" value={auctionMinIncrement} onChange={e => setAuctionMinIncrement(e.target.value)}
                  className="w-full border-2 border-purple-300 rounded-xl px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">持续时间 (秒)</label>
                <input type="number" value={auctionDuration} onChange={e => setAuctionDuration(e.target.value)}
                  className="w-full border-2 border-purple-300 rounded-xl px-4 py-2" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAuctionModal(false)} className="flex-1 py-3 bg-gray-300 rounded-xl font-bold">取消</button>
              <button onClick={handleStartAuction} disabled={!auctionItem?.tokenId || !auctionStartPrice}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold shadow-lg disabled:opacity-50">发起拍卖</button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Bid Modal */}
      {showBidModal && bidTarget && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowBidModal(false)}
        >
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-6 max-w-md w-full border-2 border-purple-300 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-4">出价竞拍</h3>
            <div className="bg-purple-50 rounded-xl p-4 mb-4 border border-purple-200">
              <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">当前出价</span><span className="font-bold">{bidTarget.highestBidder === '' ? '暂无' : bidTarget.highestBid}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">最低出价</span><span className="font-bold text-purple-700">{bidTarget.highestBidder === '' ? bidTarget.startPrice : bidTarget.highestBid + bidTarget.minBidIncrement}</span></div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-1">我的出价 (币)</label>
              <input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)} className="w-full border-2 border-purple-300 rounded-xl px-4 py-2" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowBidModal(false)} className="flex-1 py-3 bg-gray-300 rounded-xl font-bold">取消</button>
              <button onClick={handleBid} className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold shadow-lg">确认出价</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
