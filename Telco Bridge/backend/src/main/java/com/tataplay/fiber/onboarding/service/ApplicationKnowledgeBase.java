package com.tataplay.fiber.onboarding.service;

import com.tataplay.fiber.onboarding.dto.ChatbotResponse.ActionChip;
import com.tataplay.fiber.onboarding.dto.ChatbotResponse.RichCard;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class ApplicationKnowledgeBase {

    public static final String ONBOARDING_KNOWLEDGE = """
        TELCOBRIDGE ONBOARDING PORTAL KNOWLEDGE BASE (SELF & AGENT ONBOARDING):

        STEP 1: GIS FEASIBILITY & ADDRESS CHECK (`/api/onboarding/feasibility`)
        - Fields & Inputs:
          * `pinCode` (6-digit text input): Indian PIN code. Rule: PIN ending in '9' (e.g. 382009, 400009) = OUT OF COVERAGE. All other 6-digit PINs (e.g. 400001, 382007) = FULLY ACTIVE & FEASIBLE up to 1 Gbps with zero installation fee.
          * `latitude` / `longitude` (Satellite Map Marker): Drag & drop marker to pick exact building coordinates.
          * `opticalNode` (Auto-lookup label): Displays nearest optical distribution point (e.g. DP-ZONE-FTTH-400).
        - Buttons: [Verify Availability], [Auto-Fill Demo Address], [Proceed to Booking].

        STEP 2: CUSTOMER SUBSCRIBER BOOKING (`/api/onboarding/customer`)
        - Fields & Inputs:
          * `fullName` (Text): Primary subscriber's official name matching identity proof.
          * `mobileNumber` (10-digit numeric input): Receives SMS OTP and installation alerts.
          * `emailId` (Text): Receives digital CAF PDF contracts and monthly GST invoices.
          * `installationAddress` (Text area): Street name, locality, landmark.
          * `floorUnitNumber` (Text): Apartment number, floor number, block ID.
        - Buttons: [Save & Continue to OTP], [Clear Form].

        STEP 3: MOBILE SECURITY OTP VERIFICATION (`/api/onboarding/otp`)
        - Fields & Inputs:
          * `otpCode` (6-digit numeric input box): Verification code sent to registered mobile number.
          * `resendTimer` (60-second countdown display).
        - Buttons: [Verify OTP], [Resend OTP Code via SMS].

        STEP 4: DIGITAL IDENTITY KYC & DOCUMENTS (`/api/onboarding/kyc`)
        - Fields & Inputs:
          * `idType` (Dropdown): Choice of Aadhaar Card or PAN Card.
          * `idDocumentFile` (File Upload input): Accepts PDF/JPG up to 10MB file size.
          * `liveSelfie` (Webcam Liveness Camera View): Live facial liveness detection frame.
        - Buttons: [Upload Document], [Capture Live Selfie], [Proceed to Profile SLA].

        STEP 5: SUBSCRIBER PROFILE & SLA CONFIGURATION (`/api/onboarding/profile`)
        - Fields & Inputs:
          * `slaPriority` (Radio Select):
            - P1 Urgent (2-hour response time, 99.99% uptime guarantee for home businesses).
            - P2 Standard (6-hour response time, 99.95% uptime guarantee).
            - P3 Priority (12-hour response time, 99.90% uptime guarantee).
          * `ipv6StaticIp` (Checkbox): Toggle for dual-stack IPv6 static IP assignment.
        - Buttons: [Save SLA Configuration], [Proceed to Plans].

        STEP 6: BROADBAND PLAN SELECTION (`/api/onboarding/plans`)
        - Fields & Inputs:
          * `planTier` (Card Selection Grid):
            - Starter 50 Mbps: ₹549 / Month (Unlimited Data, 1080p HD Streaming).
            - Bestseller 100 Mbps: ₹799 / Month (Zero Installation Charge, Free Wi-Fi 6 Router).
            - Streamer Pro 150 Mbps: ₹999 / Month (Disney+ Hotstar, SonyLIV, ZEE5 included).
            - Gamer Ultra 300 Mbps: ₹1,499 / Month (Netflix, Prime Video, Disney+ Hotstar, SonyLIV, ZEE5, low latency <5ms gaming).
          * `billingCycle` (Toggle): Monthly vs Annual (15% Extra Discount on Annual).
        - Buttons: [Select Plan], [Compare All Plans].

        STEP 7: PAYMENT CHECKOUT (`/api/onboarding/payment`)
        - Fields & Inputs:
          * `paymentMethod` (Tabs): UPI (GPay, PhonePe, Paytm), Credit/Debit Card, Netbanking.
          * `gstBreakdown` (Display Table): Base Plan Price + 18% GST Tax calculation.
        - Buttons: [Pay Now & Generate Order], [Cancel Payment].

        STEP 8: CUSTOMER CONSENT & DIGITAL E-SIGN (`/api/onboarding/consent`)
        - Fields & Inputs:
          * `traiTermsCheck` (Checkbox): Agreement to TRAI broadband consumer terms.
          * `digitalSignature` (Touchscreen Canvas Pad): Draw digital signature.
          * `dualOtpCode` (6-digit consent OTP input).
        - Buttons: [Confirm E-Sign & Lock Order], [Download Draft Terms].

        STEP 9: TRAI CAF MASTER FORM PDF (`/api/onboarding/caf`)
        - Fields & Inputs:
          * `cafPdfViewer` (Embedded PDF Preview): Displays digitally sealed Customer Application Form contract with TRAI stamp and SHA-256 digital hash.
        - Buttons: [Download CAF PDF Contract], [Proceed to Dispatch].

        STEP 10: DOORSTEP INSTALLATION & E-KYC DISPATCH (`/api/onboarding/dispatch`)
        - Fields & Inputs:
          * `appointmentSlot` (Date & Time Picker): Morning (9 AM - 12 PM), Afternoon (1 PM - 4 PM), Evening (5 PM - 8 PM).
          * `technicianCard` (Info Display): Assigned Optical Field Engineer Rajesh Kumar (EMP-FIELD-8821), Phone: +91 98765 43210.
          * `liveGpsMap` (Interactive Tracker): Real-time field engineer location ETA (25 Mins).
        - Buttons: [Confirm Slot], [Track Engineer on GPS Map], [Call Technician].
        """;

    public static final String SELFCARE_KNOWLEDGE = """
        TELCOBRIDGE CUSTOMER SELFCARE PORTAL KNOWLEDGE BASE (`/api/selfcare/*`):
        FEATURE 1: MY DOCUMENTS & VAULT - View and download uploaded Proof of Identity (Aadhaar/PAN) and sealed CAF PDF.
        FEATURE 2: ADDRESS RELOCATION MAP - Request broadband relocation with satellite map pin dragging (₹0 relocation fee).
        FEATURE 3: SLA INCIDENT TICKETS - Raise P1/P2/P3 tickets for speed issues, router replacement, or billing.
        FEATURE 4: BILLING & INVOICES - View past 12 months GST invoices and recharge connection.
        """;

    public static final String ADMIN_KNOWLEDGE = """
        TELCOBRIDGE ENTERPRISE ADMIN PORTAL KNOWLEDGE BASE (`/api/admin/*`):
        FEATURE 1: SUBSCRIBER DIRECTORY - Search subscribers by Name, Mobile, Email, CAF ID.
        FEATURE 2: CAF ORDER LOCK OVERRIDES - Unlock order with mandatory audit rationale.
        FEATURE 3: SECURITY AUDIT TRAIL - Immutable security event log.
        FEATURE 4: NETWORK INFRASTRUCTURE - DP optical node port utilization %.
        """;

    public String getPortalKnowledge(String context) {
        if ("SELFCARE".equalsIgnoreCase(context)) return SELFCARE_KNOWLEDGE;
        if ("ADMIN".equalsIgnoreCase(context)) return ADMIN_KNOWLEDGE;
        return ONBOARDING_KNOWLEDGE;
    }

    public boolean isOutOfContextQuery(String query, String context) {
        if (query == null || query.trim().isEmpty()) return false;
        String q = query.toLowerCase().trim();

        if (q.matches(".*\\b\\d{6}\\b.*")) return false;

        List<String> inContextKeywords = Arrays.asList(
            "pin", "feasibility", "coverage", "step", "page", "nav", "back", "next", "previous",
            "book", "customer", "name", "mobile", "email", "address", "otp", "code", "kyc", "doc", "document", "documents",
            "aadhaar", "pan", "selfie", "camera", "profile", "sla", "p1", "p2", "p3", "ip", "ipv6",
            "plan", "speed", "mbps", "price", "cost", "ott", "netflix", "prime", "hotstar", "wifi",
            "pay", "payment", "upi", "card", "gst", "tax", "bill", "consent", "sign", "esign", "caf",
            "pdf", "dispatch", "technician", "engineer", "rajesh", "eta", "track", "gps", "vault",
            "relocation", "ticket", "admin", "subscriber", "audit", "node", "hi", "hello", "hey", "help",
            "support", "broadband", "fiber", "router", "telco", "tataplay", "connection", "form", "field",
            "button", "download", "upload", "option", "feature", "portal", "who", "when", "contact", "number", "phone", "where", "find",
            "recharge", "renew", "topup", "due", "status", "installation", "order", "how to"
        );

        for (String kw : inContextKeywords) {
            if (q.contains(kw)) {
                return false;
            }
        }

        return true;
    }

    public String searchKnowledge(String query, int step, String context, String lang) {
        String q = query.toLowerCase();

        // 1. Out of context check
        if (isOutOfContextQuery(query, context)) {
            return getMultilingualText(
                "I am specialized strictly as your TelcoBridge AI Telecom & Onboarding Assistant. I can only assist you with questions regarding your TelcoBridge broadband setup, plans, PIN feasibility, KYC, or support portal. How can I help you with your broadband today?",
                "मैं केवल आपके टाटा प्ले फाइबर ब्रॉडबैंड सहायक के रूप में काम करता हूँ। मैं केवल ब्रॉडबैंड सेटअप, प्लान, पिन उपलब्धता और केवाईसी से जुड़े सवालों के जवाब दे सकता हूँ।",
                "હું માત્ર તમારા ટાટા પ્લે ફાઇબર સહાયક તરીકે કામ કરું છું.",
                "मी फक्त तुमच्या टाटा प्ले फायબર सहाय्यक म्हणून काम करतो.",
                "நான் உங்கள் டெல்கோபிரிட்ஜ் AI உதவியாளர் மட்டுமே.",
                lang
            );
        }

        // 2. RECHARGE & RENEWAL QUERIES ("how to do recharge", "recharge", "renew", "topup")
        if (q.contains("recharge") || q.contains("renew") || q.contains("topup") || q.contains("bill pay")) {
            return getMultilingualText(
                "To recharge or renew your TelcoBridge fiber connection, go to Payment Checkout on Step 7 (/api/onboarding/payment) or click 'Quick Pay Dues' in the SelfCare Billing section (/api/selfcare/billing). Payments are accepted via UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, or Netbanking.",
                "अपने टाटा प्ले फाइबर कनेक्शन को रीचार्ज या रिन्यू करने के लिए स्टेप 7 पर जाएँ या सेल्फ़ केयर बिलिंग सेक्शन में 'क्विक पे' पर क्लिक करें। भुगतान यूपीआई, कार्ड या नेटबैंकिंग से स्वीकार किए जाते हैं।",
                "તમારા ફાઇબર કનેક્શનને રિચાર્જ કરવા માટે સ્ટેપ 7 પર જાઓ અથવા સેલ્ફ કેર બિલિંગમાં પેમેન્ટ કરો.",
                "तुमचे फायबर कनेक्शन रिचार्ज करण्यासाठी स्टेप 7 वर जा.",
                "உங்கள் ஃபைபர் இணைப்பை ரீசார்ஜ் செய்ய படி 7 செல்லவும்.",
                lang
            );
        }

        // 3. INSTALLATION STATUS & TRACKING QUERIES ("how to track installation status", "installation status", "order status")
        if (q.contains("track installation") || q.contains("installation status") || q.contains("order status") || (q.contains("track") && q.contains("status"))) {
            return getMultilingualText(
                "You can track your doorstep installation status and field engineer Rajesh Kumar on Step 10 (/api/onboarding/dispatch). Real-time GPS map tracking is active with an estimated arrival time of 25 Mins!",
                "आप अपनी डोरस्टेप इंस्टॉलेशन स्थिति और फ़ील्ड इंजीनियर राजेश कुमार को स्टेप 10 पर ट्रैक कर सकते हैं। लाइव जीपीएस ट्रैकिंग सक्रिय है और आगमन समय 25 मिनट है!",
                "તમે તમારી ઇન્સ્ટોલેશન સ્થિતિ અને એન્જિનિયર રાજેશ કુમારને સ્ટેપ 10 પર ટ્રૅક કરી શકો છો. સમય: 25 મિનિટ!",
                "तुम्ही तुमची इन्स्टॉलेशन स्थिती स्टेप 10 वर ट्रॅक करू शकता.",
                "படி 10 இல் இன்ஸ்டாலேஷன் நிலையை டிராக் செய்யவும்.",
                lang
            );
        }

        // 4. DOCUMENT & VAULT QUERIES
        if (q.contains("doc") || q.contains("document") || q.contains("vault") || q.contains("where to find") || q.contains("find my")) {
            return getMultilingualText(
                "You can view and download your uploaded Proof of Identity (Aadhaar/PAN) and digitally sealed TRAI CAF PDF contracts in 'My Documents & Vault' (/api/selfcare/documents) in the SelfCare Portal!",
                "आप अपने अपलोड किए गए पहचान पत्र और टीआरएआई सीएएफ पीडीएफ अनुबंध को सेल्फ़ केयर पोर्टल में 'माय डॉक्यूमेंट्स एंड वॉल्ट' से देख और डाउनलोड कर सकते हैं!",
                "તમે તમારા અપલોડ કરેલા દસ્તાવેજો અને CAF PDF કરાર સેલ્ફ કેર પોર્ટલમાં 'માય ડોક્યુમેન્ટ્સ અને વોલ્ટ'માંથી ડાઉનલોડ કરી શકો છો!",
                "तुम्ही तुमचे दस्तऐवज आणि CAF PDF करार सेल्फ केअर पोर्टलमध्ये 'માય डॉक्युमेंट्स अँड व्हॉल्ट' मधून पाहू आणि डाउनलोड करू शकता!",
                "உங்கள் ஆவணங்களை 'மை டாக்குமெண்ட்ஸ்' பக்கத்தில் பதிவிறக்கம் செய்யலாம்.",
                lang
            );
        }

        // 5. PRECISE TECHNICIAN & ENGINEER QUERIES
        if (q.contains("who is") && (q.contains("technician") || q.contains("engineer")) || q.contains("technician name") || q.contains("engineer name")) {
            return getMultilingualText(
                "Your assigned optical field engineer for doorstep installation is Rajesh Kumar (Employee ID: EMP-FIELD-8821). They are equipped with optical splicing tools and liveness verification hardware.",
                "आपके असाइन किए गए ऑप्टिकल फ़ील्ड इंजीनियर राजेश कुमार (कर्मचारी आईडी: EMP-FIELD-8821) हैं।",
                "તમારા એસાઇન કરેલ ફીલ્ડ એન્જિનિયર રાજેશ કુમાર છે.",
                "तुमचे असाइन केलेले मशिजिस्ट राजेश कुमार आहेत.",
                "உங்கள் ஃபீல்டு இன்ஜினியர் ராஜேஷ் குமார்.",
                lang
            );
        }

        if (q.contains("phone") || q.contains("contact") || q.contains("number") || q.contains("call")) {
            if (q.contains("technician") || q.contains("engineer") || q.contains("rajesh")) {
                return getMultilingualText(
                    "You can contact your assigned optical field engineer Rajesh Kumar directly at +91 98765 43210.",
                    "आप अपने फ़ील्ड इंजीनियर राजेश कुमार से सीधे +91 98765 43210 पर संपर्क कर सकते हैं।",
                    "તમે ફીલ્ડ એન્જિનિયર રાજેશ કુમારનો સંપર્ક +91 98765 43210 પર કરી શકો છો.",
                    "तुम्ही इंजिनિઅર राजेश कुमार यांच्याशी +91 98765 43210 वर संपर्क साधू शकता.",
                    "ராஜேஷ் குமாரை +91 98765 43210 இல் தொடர்பு கொள்ளலாம்.",
                    lang
                );
            }
        }

        if (q.contains("eta") || q.contains("arrival") || q.contains("when will") || q.contains("time")) {
            if (q.contains("technician") || q.contains("engineer") || q.contains("arrive") || q.contains("reach")) {
                return getMultilingualText(
                    "Optical field engineer Rajesh Kumar is currently en-route to your doorstep with an estimated arrival time of 25 Mins.",
                    "फ़ाइबर इंजीनियर राजेश कुमार वर्तमान में आपके पते के लिए रास्ते में हैं। अनुमानित आगमन समय: 25 मिनट।",
                    "ફાઇબર એન્જિનિયર રાજેશ કુમાર તમારા સરનામે આવી રહ્યા છે. સમય: 25 મિનિટ.",
                    "इंजिनિઅર राजेश कुमार तुमच्या पत्त्यावर येत आहेत. वेळ: 25 मिनिटे.",
                    "வருகை நேரம்: 25 நிமிடங்கள்.",
                    lang
                );
            }
        }

        // 6. PRECISE PLAN QUERIES
        if (q.contains("50 mbps") || q.contains("starter plan")) {
            return "The 50 Mbps Starter Plan is priced at ₹549 / Month with unlimited high-speed data and 1080p HD video streaming.";
        }
        if (q.contains("100 mbps") || q.contains("bestseller plan")) {
            return "The 100 Mbps Bestseller Plan is priced at ₹799 / Month and includes zero installation fee along with a free Wi-Fi 6 Mesh router.";
        }
        if (q.contains("150 mbps") || q.contains("streamer plan")) {
            return "The 150 Mbps Streamer Pro Plan is priced at ₹999 / Month and includes OTT app subscriptions to Disney+ Hotstar, SonyLIV, and ZEE5.";
        }
        if (q.contains("300 mbps") || q.contains("gamer plan")) {
            return "The 300 Mbps Gamer Ultra Plan is priced at ₹1,499 / Month and includes Netflix, Prime Video, Disney+ Hotstar, SonyLIV, ZEE5, and low-latency gaming (<5ms).";
        }

        // 7. SELFCARE PORTAL STRICT FALLBACK
        if ("SELFCARE".equalsIgnoreCase(context)) {
            if (q.contains("relocate") || q.contains("shift")) {
                return "In SelfCare Address Relocation, enter your new 6-digit PIN code and drag the satellite map pin to request free broadband relocation.";
            }
            if (q.contains("ticket") || q.contains("issue")) {
                return "In SelfCare Support, raise SLA incident tickets (P1 Urgent 2-hr / P2 Standard 6-hr / P3 Priority 12-hr) for speed issues or router replacement.";
            }
            return getMultilingualText(
                "Welcome to the TelcoBridge Self Care Portal (/api/selfcare/*). Here you can view & download your uploaded Proof of Identity documents and generated TRAI CAF contracts in 'My Documents & Vault', request broadband address relocation, or raise SLA support incident tickets!",
                "टाटा प्ले सेल्फ़ केयर पोर्टल में आपका स्वागत है। यहाँ आप अपने दस्तावेज़ डाउनलोड कर सकते हैं, पता बदलने का अनुरोध कर सकते हैं या सहायता टिकिट बना सकते हैं!",
                "ટાટા પ્લે સેલ્ફ કેર પોર્ટલમાં આપનું સ્વાગત છે. અહીં તમે તમારા દસ્તાવેજો ડાઉનલોડ કરી શકો છો!",
                "ટાટા પ્લે સેલ્ફ કેર પોર્ટલવર આપલે સ્વાગત આહે.",
                "டெல்கோபிரிட்ஜ் சுய சேவை போர்ட்டலுக்கு வரவேற்கிறோம்!",
                lang
            );
        }

        // 8. ADMIN PORTAL STRICT FALLBACK
        if ("ADMIN".equalsIgnoreCase(context)) {
            if (q.contains("subscriber") || q.contains("search")) {
                return "In Admin Subscriber Directory, search active accounts by Name, Mobile Number, Email, or CAF ID and export subscriber CSV reports.";
            }
            if (q.contains("override") || q.contains("unlock")) {
                return "In Admin Order Overrides, enter target Order ID and mandatory audit rationale to unlock locked CAF contracts.";
            }
            if (q.contains("audit") || q.contains("log")) {
                return "In Admin Audit Trail, view immutable security logs containing Timestamp, Event Type, User ID, IP Address, and Rationale.";
            }
            return getMultilingualText(
                "Welcome to the TelcoBridge Enterprise Admin Portal (/api/admin/*). Here administrators can search subscriber directory, manage SLA tiers, override locked CAF contracts with mandatory audit rationale, or export immutable security audit logs!",
                "टाटा प्ले एंटरप्राइज एडमिन पोर्टल में आपका स्वागत है। यहाँ एडमिन सब्सक्राइबर सूची, एसएलए और ऑडिट लॉग का प्रबंधन कर सकते हैं!",
                "ટાટા પ્લે એડમિન પોર્ટલમાં આપનું સ્વાગત છે.",
                "ટાટા પ્લે ઍડમિન પોર્ટલવર આપલે સ્વાગત આહે.",
                "டெல்கோபிரிட்ஜ் நிர்வாக போர்ட்டலுக்கு வரவேற்கிறோம்!",
                lang
            );
        }

        // 9. NAVIGATION QUERIES
        if (q.contains("back") || q.contains("previous") || q.contains("next") || q.contains("change step") || q.contains("go to step")) {
            return getMultilingualText(
                "Yes! You can easily navigate between steps in your TelcoBridge onboarding journey. Click any action chip below or use the top step progress bar to jump to your desired step!",
                "हाँ! आप अपने ऑनबोर्डिंग में किसी भी स्टेप पर वापस या आगे जा सकते हैं। नीचे दिए गए बटन पर क्लिक करें!",
                "હાં! તમે ઓનબોર્ડિંગમાં કોઈપણ સ્ટેપ પર જઈ શકો છો.",
                "होय! तुम्ही ऑनबोर्डिंगमध्ये कोणत्याही स्टेपवर जाऊ शकता.",
                "ஆம்! நீங்கள் எந்த படிக்கும் எளிதாக செல்லலாம்.",
                lang
            );
        }

        // 10. 6-DIGIT PIN CODE EVALUATION
        if (q.matches(".*\\b\\d{6}\\b.*")) {
            String pin = q.replaceAll(".*?(\\b\\d{6}\\b).*", "$1");
            if (pin.endsWith("9")) {
                return getMultilingualText(
                    "❌ Out of Coverage: TelcoBridge optical fiber network is NOT YET ACTIVE at PIN Code " + pin + ". We are expanding rapidly! Would you like to leave your contact details to get notified when fiber goes live?",
                    "❌ कवरेज से बाहर: पिन कोड " + pin + " पर टाटा प्ले फाइबर अभी उपलब्ध नहीं है।",
                    "❌ કવરેજ બહાર: પિન કોડ " + pin + " પર ટાટા પ્લે ફાઇબર ઉપલબ્ધ નથી.",
                    "❌ कवरेज बाहेर: पिन कोड " + pin + " वर टाटा प्ले फायबर उपलब्ध नाही.",
                    "❌ கவரேஜ் இல்லை: பின் குறியீடு " + pin + " இல் ஃபைபர் கிடைக்கவில்லை.",
                    lang
                );
            } else {
                return getMultilingualText(
                    "✅ Great News! TelcoBridge Ultra Fiber is FULLY ACTIVE & FEASIBLE at PIN Code " + pin + ". You can get up to 1 Gbps symmetrical speeds, zero installation charges, and 99.98% SLA uptime!",
                    "✅ बड़ी खबर! पिन कोड " + pin + " पर टाटा प्ले अल्ट्रा फाइबर पूरी तरह से सक्रिय है। आपको 1 Gbps तक की स्पीड और ज़ीरो इंस्टॉलेशन चार्ज मिलेगा!",
                    "✅ શ્રેષ્ઠ સમાચાર! પિન કોડ " + pin + " પર ટાટા પ્લે અલ્ટ્રા ફાઇબર સક્રિય છે.",
                    "✅ मोठी बातમી! पिन कोड " + pin + " वर टाटा प्ले अल्ट्रा फायબર પૂર્ણપને સક્રિય આહે.",
                    "✅ சிறந்த செய்தி! பின் குறியீடு " + pin + " இல் ஃபைபர் சேவைகள் முழுமையாக கிடைக்கின்றன!",
                    lang
                );
            }
        }

        // 11. ONBOARDING DEFAULT STEP EXPLANATION
        return getStepExplanation(step, lang);
    }

    public String getStepExplanation(int step, String lang) {
        switch (step) {
            case 1:
                return getMultilingualText(
                    "You are on Step 1: GIS Feasibility Check (/api/onboarding/feasibility). Fields: `pinCode` (6-digit PIN), satellite map pin marker, optical node `DP-ZONE-FTTH-{pin}`.",
                    "आप स्टेप 1: जीआईएस उपलब्धता जांच पर हैं। फ़ील्ड्स: पिन कोड, सैटेलाइट मैप पिन, ऑप्टिकल नोड।",
                    "તમે સ્ટેપ 1: GIS ઉપલબ્ધતા તપાસ પર છો.",
                    "तुम्ही स्टेप 1: GIS उपलब्धता तपासणीवर आहात.",
                    "நீங்கள் படி 1: ஃபைபர் கிடைப்பதை சரிபார்க்க 6 இலக்க பின் குறியீட்டை உள்ளிடவும்!",
                    lang
                );
            case 2:
                return getMultilingualText(
                    "You are on Step 2: Customer Subscriber Booking (/api/onboarding/customer). Fields: `fullName`, `mobileNumber` (10-digit), `emailId`, `installationAddress`, `floorUnitNumber`.",
                    "आप स्टेप 2: ग्राहक बुकिंग पर हैं। फ़ील्ड्स: पूरा नाम, 10 अंकों का मोबाइल नंबर, ईमेल आईडी, स्थापना पता, फ़्लोर/यूनिट नंबर।",
                    "તમે સ્ટેપ 2: ગ્રાહક બુકિંગ પર છો.",
                    "तुम्ही स्टेप 2: ग्राहक बुकिंगवर आहात.",
                    "நீங்கள் படி 2: வாடிக்கையாளர் முன்பதிவில் உள்ளீர்கள்.",
                    lang
                );
            case 3:
                return getMultilingualText(
                    "You are on Step 3: Mobile OTP Verification (/api/onboarding/otp). Fields: `otpCode` (6-digit numeric input), `resendTimer` (60-second countdown display).",
                    "आप स्टेप 3: मोबाइल ओटीपी सत्यापन पर हैं। फ़ील्ड्स: 6 अंकों का ओटीपी कोड, 60 सेकंड का रीसेंड टाइमर।",
                    "તમે સ્ટેપ 3: મોબાઇલ OTP ચકાસણી પર છો.",
                    "तुम्ही स्टेप 3: मोबाईल ओटीપી पडताळणीवर आहात.",
                    "நீங்கள் படி 3: மொபைல் OTP சரிபார்ப்பில் உள்ளீர்கள்.",
                    lang
                );
            case 4:
                return getMultilingualText(
                    "You are on Step 4: Digital Identity KYC (/api/onboarding/kyc). Fields: `idType` (Aadhaar / PAN dropdown), `idDocumentFile` (max 10MB PDF/JPG), `liveSelfie` (webcam liveness frame).",
                    "आप स्टेप 4: डिजिटल केवाईसी पर हैं। फ़ील्ड्स: पहचान पत्र प्रकार (आधार/पैन), 10MB दस्तावेज़ अपलोड, लाइव वेबकैम सेल्फी।",
                    "તમે સ્ટેપ 4: ડિજિટલ કેવાયસી પર છો.",
                    "तुम्ही स्टेप 4: डिजिटल केवायસીવર આહાત.",
                    "நீங்கள் படி 4: டிஜிட்டல் KYC இல் உள்ளீர்கள்.",
                    lang
                );
            case 5:
                return getMultilingualText(
                    "You are on Step 5: Subscriber Profile & SLA Configuration (/api/onboarding/profile). Fields: `slaPriority` (P1 Urgent 2-hr / P2 Standard 6-hr / P3 Priority 12-hr), `ipv6StaticIp` (checkbox).",
                    "आप स्टेप 5: प्रोफ़ाइल और एसएलए पर हैं। फ़ील्ड्स: सेवा प्राथमिकता एसएलए (P1/P2/P3) और स्टैटिक IPv6 IP ज़िप।",
                    "તમે સ્ટેપ 5: પ્રોફાઇલ અને SLA સેટિંગ પર છો.",
                    "तुम्ही स्टेप 5: प्रोफाईલ અને અસએલએ વર આહાત.",
                    "நீங்கள் படி 5: SLA சுயவிவர அமைப்பில் உள்ளீர்கள்.",
                    lang
                );
            case 6:
                return getMultilingualText(
                    "You are on Step 6: Broadband Plan Selection (/api/onboarding/plans). Fields: `planTier` (50 Mbps Starter ₹549 / 100 Mbps Bestseller ₹799 / 150 Mbps Streamer ₹999 / 300 Mbps Gamer ₹1499), `billingCycle` (Monthly vs Annual 15% off).",
                    "आप स्टेप 6: ब्रॉडबैंड प्लान चयन पर हैं। फ़ील्ड्स: 50 से 300 Mbps प्लान ग्रिड, मासिक या वार्षिक बिलिंग चक्र।",
                    "તમે સ્ટેપ 6: પ્લાન પસંદગી પર છો.",
                    "तुम्ही स्टेप 6: ब्रॉडબઁડ प्लॅन निवડીવર આહાત.",
                    "நீங்கள் படி 6: பிராட்பேண்ட் திட்டத் தேர்வில் உள்ளீர்கள்!",
                    lang
                );
            case 7:
                return getMultilingualText(
                    "You are on Step 7: Payment Checkout (/api/onboarding/payment). Fields: `paymentMethod` (UPI / Card / Netbanking), `gstBreakdown` (Base Plan + 18% GST tax table).",
                    "आप स्टेप 7: पेमेंट चेकआउट पर हैं। फ़ील्ड्स: भुगतान विधि (यूपीआई/कार्ड/नेटबैंकिंग) और 18% GST ब्रेकडाउन टेबल।",
                    "તમે સ્ટેપ 7: પેમેન્ટ ચેકઆઉટ પર છો.",
                    "तुम्ही स्टेप 7: पेमेंट चेकआउटवर आहात.",
                    "நீங்கள் படி 7: கட்டணம் செலுத்தும் பக்கத்தில் உள்ளீர்கள்.",
                    lang
                );
            case 8:
                return getMultilingualText(
                    "You are on Step 8: Customer Consent & Digital Signature (/api/onboarding/consent). Fields: `traiTermsCheck` (checkbox), `digitalSignature` (touchscreen canvas pad), `dualOtpCode` (6-digit input).",
                    "आप स्टेप 8: ग्राहक सहमति पर हैं। फ़ील्ड्स: टीआरएआई शर्तें चेकबॉक्स, टचस्क्रीन डिजिटल हस्ताक्षर पैड, सहमति ओटीपी।",
                    "તમે સ્ટેપ 8: સંમતિ અને ડિજિટલ સહી પર છો.",
                    "तुम्ही स्टेप 8: ग्राहक संमती आणि डिजिटल सहीवर आहात.",
                    "நீங்கள் படி 8: வாடிக்கையாளர் ஒப்புதல் பக்கத்தில் உள்ளீர்கள்.",
                    lang
                );
            case 9:
                return getMultilingualText(
                    "You are on Step 9: TRAI CAF Master Form (/api/onboarding/caf). Fields: `cafPdfViewer` (embedded preview of digitally sealed Customer Application Form contract PDF with SHA-256 digital seal).",
                    "आप स्टेप 9: टीआरएआई सीएएफ मास्टर फॉर्म पर हैं। फ़ील्ड्स: डिजिटली सील किए गए सीएएफ पीडीएफ अनुबंध पूर्वावलोकन।",
                    "તમે સ્ટેપ 9: CAF માસ્ટર ફોર્મ પર છો.",
                    "तुम्ही स्टेप 9: सीएएफ मास्टर फॉर्मवर आहात.",
                    "நீங்கள் படி 9: CAF ஒப்பந்த படிவத்தில் உள்ளீர்கள்.",
                    lang
                );
            case 10:
                return getMultilingualText(
                    "You are on Step 10: Doorstep Installation & E-KYC Dispatch (/api/onboarding/dispatch). Fields: `appointmentSlot` (Morning/Afternoon/Evening), `technicianCard` (Rajesh Kumar EMP-8821), `liveGpsMap` (ETA 25 Mins tracker).",
                    "आप स्टेप 10: डोरस्टेप इंस्टॉलेशन और ई-केवाईसी पर हैं। फ़ील्ड्स: समय स्लॉट, तकनीशियन कार्ड (राजेश कुमार) और जीपीएस ट्रैकर।",
                    "તમે સ્ટેપ 10: ડોરસ્ટેપ ઇન્સ્ટોલેશન પર છો.",
                    "तुम्ही स्टेप 10: डोअरस्टेप इन्સ્ટોલેશનવર આહાત.",
                    "நீங்கள் படி 10: நேரடி வரைபடத்தில் ஃபீல்டு இன்ஜினியர் ராஜேஷ் குமாரை டிராக் செய்யவும்!",
                    lang
                );
            default:
                return getMultilingualText(
                    "Hello! I am your TelcoBridge AI Assistant. How can I help you today?",
                    "नमस्ते! मैं आपका टाटा प्ले फाइबर सहायक हूँ।",
                    "નમસ્તે! હું તમારો ટાટા પ્લે ફાઇબર સહાયક છું.",
                    "नमस्कार! मी तुमचा टाटा प्ले फायबर सहाय्यक आहे.",
                    "வணக்கம்! நான் உங்கள் டெல்கோபிரிட்ஜ AI உதவியாளர்.",
                    lang
                );
        }
    }

    private String getMultilingualText(String en, String hi, String gu, String mr, String ta, String lang) {
        if ("HI".equalsIgnoreCase(lang)) return hi;
        if ("GU".equalsIgnoreCase(lang)) return gu;
        if ("MR".equalsIgnoreCase(lang)) return mr;
        if ("TA".equalsIgnoreCase(lang)) return ta;
        return en;
    }
}
