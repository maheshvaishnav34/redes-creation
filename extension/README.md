# Redes Creation — Google Review 1-Click Auto-Post Extension (v1.2.0)

### ⚠️ Agar Google par text ya star nahi aa raha hai to ye karein (10 Seconds):
Browser security ke kaaran koi bhi website Google ke page par direct JavaScript nahi chala sakti. Isliye ye Chrome Extension banaya gaya hai.

**Extension ko Chrome me Reload / Load karna zaroori hai:**
1. Google Chrome me naya tab kholein aur type karein: `chrome://extensions`
2. Agar pehle se load kiya hua hai: **"Redes Creation — Google Review Auto-Filler"** card par **↻ (Reload icon)** dabayein!
3. Agar pehli baar kar rahe hain:
   - Top-right corner me **"Developer mode"** toggle ko **ON** karein.
   - Top-left me **"Load unpacked"** button dabayein.
   - Folder select karein: `c:\Users\dell\Desktop\Redes Creation\extension`
4. Ab feedback page (`http://localhost:5173/feedback/review-campaign-oct-8539`) par jaakar **"Submit Review on Google"** dabayein!

---

### Is Naye Version (v1.2.0) me kya naya hai:
1. **⚡ Decoupled 5★ Selection**: Ab Google review modal khulte hi turant 5 Stars click hote hain (bina textarea ka wait kiye).
2. **🛡️ Google Info Popover Auto-Dismiss**: Google jo "How your posts appear" popup dikhata hai, extension usko automatically dismiss/hide kar deta hai taaki clicks block na hon.
3. **✍️ Direct Text Injection**: Review draft automatically `Enter review` textarea me dispatch hota hai with native input & change events.
4. **🚀 1-Click Auto-Submit**: Google ka "Post" button detect hokar automatically click ho jata hai.
5. **✨ Floating On-Screen Helper**: Google ke tab par right-bottom me ek sleek widget appear hota hai jo status dikhata hai aur agar chaho to direct `🚀 1-Click Post` button provide karta hai!
6. **📋 Zero-Friction Fallback**: Clipboard me text hamesha copied rehta hai, agar extension install na bhi ho to customer sirf `Ctrl + V` karke paste kar sakta hai.
