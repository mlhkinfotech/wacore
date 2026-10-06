# MLHK POS - AI WhatsApp Agent Documentation

Yeh document MLHK POS ke WhatsApp AI Agent ki complete working, architecture, aur file references ko explain karta hai. Ye guide A to Z detail deti hai ki jab customer message karta hai toh AI kaise sochta hai aur kaise reply karta hai.

---

## 📂 Core Files Reference

### 1. Backend Service (Node.js)
* **`whatsapp-service/src/whatsapp/client.js`**: 
  * **Role**: Ye WhatsApp (Baileys) ka main connection engine hai. Ye incoming messages sunta hai aur unhe AI processing ke liye bhejta hai.
  * **Key Function**: `sock.ev.on('messages.upsert')` jahan naye messages aate hain, image download hoti hai, aur AI ko trigger kiya jata hai.
* **`whatsapp-service/src/ai/agent.js`**: 
  * **Role**: Ye AI ka "Dimag" (Brain) hai. Ye LLM (Language Model) ko prompt bhejta hai, product search karta hai, memory manage karta hai, aur buy-intent (khareedne ka iraada) samajhta hai.
  * **Key Function**: `processAgentMessage()` jo reply aur product images generate karta hai.
* **`whatsapp-service/src/index.js`**: 
  * **Role**: Entry point jo server, database, schedulers aur webhook APIs start karta hai.
* **`whatsapp-service/src/schedulers/messageScheduler.js`**: 
  * **Role**: Customer ki activity (inquiry, order) ke basis par lead ka score update karta hai (Lead Scoring).
* **`whatsapp-service/src/whatsapp/notifications.js`**: 
  * **Role**: Jab naya lead banta hai ya AI chat ko human ke liye chhodta hai (Handoff), toh shop owner ke personal WhatsApp par notification bhejta hai.

### 2. Frontend / Admin UI (Laravel / PHP)
* **`app/Http/Controllers/WhatsAppController.php`**: Laravel backend jo AI settings ko database me save/load karta hai.
* **`resources/views/whatsapp/pages/ai-settings.blade.php`**: Web UI jahan admin AI ka prompt, delay time, aur model change kar sakta hai.
* **`resources/views/whatsapp/pages/dashboard.blade.php`**: Chat UI jahan admin kisi bhi specific customer ke liye AI ko chalu (ON) ya band (OFF) kar sakta hai.

### 3. Database Tables
* `wa_ai_settings`: AI ke global rules, prompt, typing delay.
* `wa_ai_contact_settings`: Har specific customer ke liye AI ON hai ya OFF, uska status.
* `wa_messages`: Pura chat history (taki AI pichli baatein yaad rakh sake).
* `contacts`: POS leads jahan naye WhatsApp numbers automatically save hote hain.

---

## ⚙️ How It Works: Step-by-Step Flow (A to Z)

### Step 1: Customer Message Aata Hai
Jab koi customer aapke WhatsApp par message bhejta hai, Baileys WebSocket us message ko `client.js` me catch karta hai.
* **Image Check**: Agar message me photo hai, toh system pehle us photo ka buffer download karta hai (AI Vision ke liye).
* **Lead Creation**: Agar number naya hai, toh ye silently POS database (`contacts` table) me usey as a "Lead" save kar leta hai aur owner ko WhatsApp par ek "New Lead Alert" bhej deta hai.

### Step 2: AI Check & Filter
Message seedhe AI ko nahi jata. Pehle kuch filters check hote hain:
* Kya ye group message hai? (Agar group me AI OFF hai, toh ignore karta hai).
* **Human Override**: Kya admin ne is specific contact ke liye AI band (OFF) kiya hua hai? (Agar haan, toh AI reply nahi karega).
* Kya message format valid hai? (Images aur text process hote hain, audio/document ignore hote hain).

### Step 3: Context & Memory Building (`agent.js`)
* AI agent pehle database se is customer ki **pichli 20 chats** nikalta hai (Memory). 
* Ek **System Prompt** tayar kiya jata hai (jo admin ne settings me set kiya hai) jo AI ko uske rules batata hai (jaise: "Aap ek friendly sales assistant ho... prices Rs me batana...").

### Step 4: LLM Processing & Product Matching
* Message (aur photo, agar ho) Language Model (LLM) ko bheja jata hai. 
* Agar customer ne koi product pucha hai ("Lenovo laptop hai kya?"), toh AI ka logic database se `products` aur `variations` table me search karta hai.
* System automatically ek **Product Card** banata hai jisme Product ka Naam, Price (Rs), Specs, Warranty, aur ek direct khareedne ka URL hota hai.

### Step 5: Realistic Typing Delay
* Taki AI insaan jaisa lage, system ek chota delay (jaise 1 se 3 second) add karta hai.
* Is delay ke dauran customer ke WhatsApp par **"Typing..."** likha aata hai (`sock.sendPresenceUpdate('composing')`).

### Step 6: Reply Send Karna
* AI apna Text reply bhejta hai.
* Agar product dhoondha gaya tha, toh us product ki **Image** bhi automatically send ki jati hai ek proper caption ke sath.
* Ye sab baatein database (`wa_messages`) me save ho jati hain taki agli baar AI ko reference mil sake.

### Step 7: Handoff & Lead Scoring
* **Lead Scoring**: Agar message me buy intent tha (jaise customer bola "mujhe khareedna hai"), toh lead ka score badha diya jata hai.
* **Human Handoff**: Agar customer koi aisi baat puchta hai jiska AI ke paas jawab nahi hai, ya customer direct insaan se baat karna chahta hai, toh AI automatically khud ko us number ke liye **OFF** kar leta hai. Iske baad AI admin ko ek alert bhejta hai: *"Human handoff requested... AI is chat ke liye OFF kar di gayi hai. Aap reply karein."*

---

## 🚀 How to Start / Stop / Debug

1. **Service Start Karna**: 
   Docker use kar rahe hain toh WhatsApp service background me hamesha chalti hai. Agar manually restart karni ho:
   `docker compose restart whatsapp`

2. **Logs Dekhna (Debug)**:
   Agar dekhna ho ki AI kya soch raha hai ya error kahan hai:
   `docker compose logs -f whatsapp`

3. **Global AI Band Karna**:
   POS Web Dashboard -> WhatsApp -> AI Settings me jaa kar master switch ON/OFF kiya jaa sakta hai.

4. **Kissi ek Customer ki AI Band Karna**:
   POS Dashboard -> WhatsApp Chats me customer ki chat open karein -> Top right par "AI ON" button par click karke usey "AI OFF" kar dein. Ye `wa_ai_contact_settings` me save ho jayega.

---

**Summary:** 
Aapka AI architecture bohot hi modular hai. `client.js` sirf WhatsApp ka kaam dekhta hai, aur `agent.js` sirf dimaag ka kaam karta hai. Ye structure aage chalkar OpenAI, Gemini ya kisi aur LLM model par switch karne ke liye bhi bohot flexible hai.
