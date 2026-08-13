import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Sparkles, Loader2, CheckCircle, XCircle, ShieldCheck, Clock, MapPin, Users } from 'lucide-react';

export const ModerationWorkspace: React.FC = () => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string>('Init...');

  useEffect(() => {
    // Automatically trigger AI Moderation API for any unmoderated suggestions
    const unmoderated = suggestions.filter(s => !s.aiModeration && !s._aiRequested);
    
    unmoderated.forEach(async (sug) => {
      // Mark as requested to prevent duplicate API calls
      sug._aiRequested = true;
      try {
        setDebugLog(`Calling AI API for: ${sug.id}`);
        const response = await fetch('/api/moderate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: sug.title,
            context: 'Đề xuất địa điểm từ thiện',
            text: sug.description || sug.note || ''
          })
        });
        
        if (response.ok) {
          const aiResult = await response.json();
          // Map backend response to frontend expected structure
          const moderationData = {
            isAppropriate: aiResult.isSafe,
            summary: (aiResult.summaryBullets && aiResult.summaryBullets.length > 0) 
              ? '- ' + aiResult.summaryBullets.join('<br/>- ') 
              : aiResult.reasoning || 'Đã phân tích nội dung.',
            reviewedAt: serverTimestamp()
          };
          
          setDebugLog(`Updating Firestore for: ${sug.id}`);
          const docRef = doc(db, 'suggestions', sug.id);
          await updateDoc(docRef, { aiModeration: moderationData });
        } else {
          console.error(`AI API failed for ${sug.id}:`, await response.text());
        }
      } catch (err: any) {
        console.error(`Error moderating ${sug.id}:`, err);
      }
    });
  }, [suggestions]);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;
    
    setDebugLog('Setting up auth listener...');
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setDebugLog('Auth fired: ' + (user ? user.uid : 'null'));
      if (user) {
        setDebugLog('Querying firestore...');
        try {
          const q = query(
            collection(db, 'suggestions'),
            where('status', '==', 'pending')
          );
          
          unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
            setDebugLog('Snapshot received! Docs: ' + snapshot.docs.length);
            try {
              const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              data.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
              setSuggestions(data);
              setLoading(false);
            } catch (err: any) {
              setDebugLog('Error parsing docs: ' + err.message);
              setLoading(false);
            }
          }, (error) => {
            setDebugLog('Firestore error: ' + error.message);
            console.error("Firestore error:", error);
            setLoading(false);
          });
        } catch (err: any) {
          setDebugLog('Error querying: ' + err.message);
          setLoading(false);
        }
      } else {
        setSuggestions([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const handleApprove = async (sug: any) => {
    setProcessingId(sug.id);
    try {
      await updateDoc(doc(db, 'suggestions', sug.id), {
        status: 'approved',
        reviewedBy: 'AI Moderator Tool',
        reviewedAt: serverTimestamp()
      });
      
      await addDoc(collection(db, 'locations'), {
        title: sug.title,
        description: sug.description,
        lat: sug.lat,
        lng: sug.lng,
        address: sug.address || '',
        helpTypes: sug.helpTypes || [],
        urgency: sug.urgency || 'normal',
        peopleCount: sug.peopleCount || 1,
        timeFrom: sug.timeFrom || '',
        timeTo: sug.timeTo || '',
        note: sug.note || '',
        imageUrl: sug.imageUrl || null,
        isActive: true,
        createdBy: sug.submittedBy,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Lỗi duyệt:", err);
      alert("Đã xảy ra lỗi khi duyệt. Vui lòng thử lại.");
    }
    setProcessingId(null);
  };

  const handleReject = async (sug: any) => {
    const reason = prompt("Nhập lý do từ chối (tùy chọn):");
    if (reason === null) return; 
    
    setProcessingId(sug.id);
    try {
      await updateDoc(doc(db, 'suggestions', sug.id), {
        status: 'rejected',
        rejectedReason: reason,
        reviewedBy: 'AI Moderator Tool',
        reviewedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Lỗi từ chối:", err);
      alert("Đã xảy ra lỗi khi từ chối. Vui lòng thử lại.");
    }
    setProcessingId(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-4" />
        <div className="text-xs text-gray-500 font-medium">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-8">

        {suggestions.length === 0 ? (
          <div className="text-center py-12">
            <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Không có đề xuất mới</h3>
            <p className="text-xs text-gray-500 mt-1">Tất cả đề xuất đã được kiểm duyệt xong.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((sug) => {
              const aiResult = sug.aiModeration;
              const isSafe = aiResult?.isAppropriate;
              
              return (
                <div key={sug.id} className={`border rounded-xl p-5 transition-colors ${
                  !aiResult ? 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700' :
                  isSafe ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800/30' : 
                  'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/30'
                }`}>
                  <div className="flex flex-col md:flex-row gap-5">
                    {/* Left: Suggestion Data */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{sug.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Đề xuất bởi: {sug.submitterName || 'Ẩn danh'}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        {sug.address && <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300"><MapPin className="w-3 h-3"/> {sug.address}</span>}
                        {sug.peopleCount && <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300"><Users className="w-3 h-3"/> {sug.peopleCount} người</span>}
                        <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300"><Clock className="w-3 h-3"/> {sug.timeFrom || '--'} - {sug.timeTo || '--'}</span>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 leading-relaxed max-h-32 overflow-y-auto">
                        {sug.description}
                      </div>
                    </div>
                    
                    {/* Right: AI Analysis & Actions */}
                    <div className="md:w-72 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 pt-4 md:pt-0 md:pl-5">
                      <div>
                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                          Kết Quả Phân Tích AI
                        </div>
                        
                        {!aiResult ? (
                          <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                            <Loader2 className="w-3 h-3 inline animate-spin mr-1"/> Đang chờ AI phân tích...
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isSafe ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {isSafe ? <CheckCircle className="w-3.5 h-3.5"/> : <XCircle className="w-3.5 h-3.5"/>}
                              {isSafe ? 'Nội dung an toàn' : 'Phát hiện rủi ro / Cảnh báo'}
                            </div>
                            
                            <div className="text-[12px] text-gray-600 dark:text-gray-400 prose prose-sm leading-relaxed" 
                                 dangerouslySetInnerHTML={{__html: aiResult.summary?.replace(/\\n/g, '<br/>') || ''}} />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                          onClick={() => handleApprove(sug)}
                          disabled={processingId === sug.id || !aiResult}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-1 cursor-pointer"
                        >
                          {processingId === sug.id ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Duyệt'}
                        </button>
                        <button
                          onClick={() => handleReject(sug)}
                          disabled={processingId === sug.id}
                          className="flex-1 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-bold py-2 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-1 cursor-pointer"
                        >
                          {processingId === sug.id ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Từ chối'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
