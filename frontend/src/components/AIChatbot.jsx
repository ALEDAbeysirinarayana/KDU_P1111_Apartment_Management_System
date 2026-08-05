import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Bot, X, Send, Sparkles, Minimize2, Maximize2, 
  Building2, ShieldCheck, Wrench, UserCheck, 
  FileText, Calendar, Car, CreditCard, ArrowRight, Mail, Phone, MessageCircle
} from 'lucide-react';

export default function AIChatbot() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  // Full System Menu & Overview Template
  const SYSTEM_MENU_TEXT = `🤖 **Aura System Knowledge & Support Hub**

🏢 **1. System Overview & Stats**
• **Units**: 60 Units (20 per Block across A, B, C)
• **Users**: 34 Registered Accounts (24 Approved + 10 Pending)
• **Facilities**: 8 Managed Amenities (Pool, Gym, Hall, Sauna, Tennis, etc.)
• **Parking**: 66 Slots (60 Permanent + 6 Guest) & 10 Visitor Requests
• **Complaints**: 20 Maintenance Tickets (Emergency, In Progress, Resolved)
• **Notices**: 15 Community Announcements

👥 **2. Management & User Roles**
• **System Admin**: Full system management & approvals
• **Staff Members**: Facility bookings, resident approvals & notices
• **Maintenance Team**: Repairs, plumbing, electrical & HVAC
• **Homeowners & Tenants**: Apartment residents directory

📖 **3. How-To Guides**
• How to submit a maintenance complaint
• How to book an apartment facility
• How to request visitor guest parking
• How to pay monthly invoices & bills
• How to register a new resident account

☎️ **4. Contact Support**
• ✉️ **Email**: \`apartmentmanagementsystem123@gmail.com\`
• 📞 **Phone / WhatsApp**: \`+94 11 0123 321\``;

  const MAIN_SUGGESTIONS = [
    '🏢 System Stats & Overview',
    '👥 Admin & Staff Details',
    '🛠️ How to Submit Complaint',
    '📅 How to Book Facility',
    '💳 How to Pay Bills',
    '🚗 How to Request Parking',
    '☎️ Contact Support'
  ];

  // Initial state when first opened: NO message text, ONLY Option Chips
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: '',
      time: '',
      suggestions: MAIN_SUGGESTIONS
    }
  ]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, isTyping]);

  // Handle Smart Response Generation
  const generateResponse = async (userQuery) => {
    const query = userQuery.toLowerCase().trim();

    // 1. "How are you?" / "How are you doing?"
    if (/(how are you|how r u|how do you do|how are u)/.test(query)) {
      return {
        text: `I'm doing great, thank you for asking! 😊 I'm fully operational and ready to assist you with the Aura Apartment Management System.\n\nHow can I help you today?\n\n${SYSTEM_MENU_TEXT}`,
        suggestions: MAIN_SUGGESTIONS
      };
    }

    // 2. "What's up?" / "Sup?"
    if (/(what's up|whats up|what up|sup|wsp)/.test(query)) {
      return {
        text: `Not much! Just monitoring apartment units, maintenance tickets, and helping residents. 🏢\n\nHere is how I can assist you today:\n\n${SYSTEM_MENU_TEXT}`,
        suggestions: MAIN_SUGGESTIONS
      };
    }

    // 3. "How old are you?" / "Who built you?"
    if (/(how old|your age|who created|who built|who made|who are you)/.test(query)) {
      return {
        text: `I am Aura AI, built specifically as the intelligent assistant for the Aura Apartment Management System! 🤖 I may be digital, but I know everything about this apartment system.\n\nHere is what I can help you with:\n\n${SYSTEM_MENU_TEXT}`,
        suggestions: MAIN_SUGGESTIONS
      };
    }

    // 4. "Can you help me?" / "Help" / "I need help"
    if (/(can you help|help me|need help|can u help|assistance|help)/.test(query)) {
      return {
        text: `I'd be glad to help you! 😊 I can assist you with system stats, user details, submitting complaints, booking facilities, paying bills, or contacting support.\n\nHere are all available options:\n\n${SYSTEM_MENU_TEXT}`,
        suggestions: MAIN_SUGGESTIONS
      };
    }

    // 5. Greetings (Hi, Hello, Hey, etc.)
    if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|hi there|hey there)/.test(query)) {
      const nameGreeting = user ? `, ${user.full_name || user.role}` : '';
      return {
        text: `Hello${nameGreeting}! 😊 Welcome to Aura Apartment Management System.\n\nHere are all the valuable options and details I can assist you with:\n\n${SYSTEM_MENU_TEXT}`,
        suggestions: MAIN_SUGGESTIONS
      };
    }

    // 2. Thanks / Gratitude
    if (/(thanks|thank you|thx|awesome|great|cool|perfect|good job)/.test(query)) {
      return {
        text: `You're very welcome! 🌟 I'm always here to help. Feel free to choose any option below:`,
        suggestions: MAIN_SUGGESTIONS
      };
    }

    // 3. Contact Support (Email / Phone / WhatsApp)
    if (/(contact|support|helpdesk|email|phone|whatsapp|call|reach)/.test(query)) {
      return {
        text: `☎️ **Contact Support & Customer Helpdesk**:\n\nWe are available 24/7 to assist you!\n\n• ✉️ **Email Support**: \`apartmentmanagementsystem123@gmail.com\`\n• 📞 **Phone / WhatsApp**: \`+94 11 0123 321\`\n• 💬 **WhatsApp**: Available for instant chat & support inquiries.\n\nFeel free to email or message us directly on WhatsApp!`,
        contactLinks: true,
        suggestions: MAIN_SUGGESTIONS
      };
    }

    // 4. Who are they / User Details / Admin / Staff / Maintenance / Directory
    if (/(who is|who are|admin|staff|maintenance|manager|who are they|team|directory|role)/.test(query)) {
      if (query.includes('admin')) {
        return {
          text: `👑 **System Admin Information**:\n• **Role**: Full System Management & Approval Authority\n• **Email**: \`admin@apartment.com\`\n• **Responsibilities**: Registration approvals, invoice generation, notices publishing, and user permissions control.`,
          suggestions: ['👥 Staff Members', '🔧 Maintenance Team', '☎️ Contact Support']
        };
      }
      if (query.includes('staff')) {
        return {
          text: `👔 **Office Staff Members**:\n• **Primary Staff**: \`staff@apartment.com\`\n• **Kumari Silva**: \`staff.sarah@apartment.com\`\n• **Responsibilities**: Facility booking approvals, resident verification, and notice broadcasts.`,
          suggestions: ['👑 System Admin', '🔧 Maintenance Team', '☎️ Contact Support']
        };
      }
      if (query.includes('maintenance') || query.includes('technician')) {
        return {
          text: `🔧 **Maintenance Team & Technicians**:\n• **Chief Technician**: \`maintenance@apartment.com\`\n• **Sunil Wickramasinghe**: \`maint.alex@apartment.com\`\n• **Services**: Plumbing repairs, electrical maintenance, elevator servicing, HVAC & structural repairs.`,
          suggestions: ['🛠️ How to Submit Complaint', '☎️ Contact Support']
        };
      }

      return {
        text: `👥 **Management & User Roles Directory**:\n\n1. 👑 **System Admin**: Oversees system management & approvals (\`admin@apartment.com\`)\n2. 👔 **Office Staff**: Handles facility bookings & resident requests (\`staff@apartment.com\` & Kumari Silva)\n3. 🔧 **Maintenance Team**: Resolves maintenance tickets (\`maintenance@apartment.com\` & Sunil W.)\n4. 🏡 **Homeowners**: 12 Approved + 5 Pending accounts across Blocks A, B, C\n5. 🔑 **Tenants**: 7 Approved + 5 Pending registered tenants`,
        suggestions: ['👑 System Admin', '👔 Office Staff', '🛠️ How to Submit Complaint', '☎️ Contact Support']
      };
    }

    // 5. System Stats / "How many" / Overview
    if (/(how many|total|count|statistics|stats|overview|number of|summary)/.test(query)) {
      if (query.includes('unit') || query.includes('block') || query.includes('apartment')) {
        return {
          text: `🏢 **Units & Blocks Information**:\n• **Total Units**: 60 Units\n• **Block Breakdown**:\n  - Block A: 20 Units (A01 to A20)\n  - Block B: 20 Units (B01 to B20)\n  - Block C: 20 Units (C01 to C20)\n• **Types**: 1BHK, 2BHK, 3BHK\n• **Status**: Occupied by residents or vacant.`,
          suggestions: ['🚗 Parking Slots', '🏊 Facilities List', '☎️ Contact Support']
        };
      }
      if (query.includes('parking') || query.includes('slot') || query.includes('visitor')) {
        return {
          text: `🚗 **Parking Management Information**:\n• **Total Slots**: 66 Slots\n• **Permanent Slots**: 60 (P-A01 to P-C20 assigned to units)\n• **Guest/Visitor Slots**: 6 Visitor Slots (G-001 to G-006)\n• **Visitor Requests**: 10 active visitor booking requests.`,
          suggestions: ['🚗 How to Request Parking', '🏢 Units & Blocks', '☎️ Contact Support']
        };
      }
      if (query.includes('facility') || query.includes('facilities') || query.includes('gym') || query.includes('pool')) {
        return {
          text: `🏊 **Apartment Facilities (8 Managed Amenities)**:\n1. Main Swimming Pool (Cap: 25)\n2. Rooftop Garden (Cap: 50)\n3. Business Center (Cap: 10)\n4. Resident Gym (Cap: 30)\n5. Multipurpose Hall (Cap: 80)\n6. Kids Play Area (Cap: 20)\n7. Sauna & Steam Room (Cap: 8)\n8. Tennis Court (Cap: 4)\n• **Seeded Requests**: 10 active booking requests.`,
          suggestions: ['📅 How to Book Facility', '🏢 Units & Blocks', '☎️ Contact Support']
        };
      }
      if (query.includes('complaint') || query.includes('ticket') || query.includes('repair')) {
        return {
          text: `🛠️ **Complaints & Maintenance Stats**:\n• **Total Tickets**: 20 Complaints\n• 🔴 Emergency: 2\n• 🟠 In Progress: 7\n• 🟡 Pending: 5\n• ✅ Resolved: 6\nCategories: Plumbing, Electrical, HVAC, Noise, Elevator, Security, Cleanliness & Structural.`,
          suggestions: ['🛠️ How to Submit Complaint', '🔧 Maintenance Team']
        };
      }
      if (query.includes('notice') || query.includes('announcement')) {
        return {
          text: `📢 **Notices & Announcements Stats**:\n• **Total Notices**: 15 Announcements\n• 📢 Published: 7 Live Notices\n• 📅 Scheduled: 4 Upcoming Notices\n• ⌛ Expired/Archived: 4 Notices\nCategories: Utility, Security, Event, Maintenance, Safety & Policy.`,
          suggestions: ['📢 System Stats', '☎️ Contact Support']
        };
      }
      if (query.includes('bill') || query.includes('payment') || query.includes('invoice') || query.includes('money') || query.includes('revenue')) {
        return {
          text: `💳 **Payments & Billing Overview**:\n• **Total Invoices**: 25 Invoices\n• **Payments Collected**: LKR 272,700 (15 Paid)\n• **Pending/Overdue**: 10 Invoices\n• **Methods**: Bank Transfer, Online Payment, Card, Cash.`,
          suggestions: ['💳 How to Pay Bills', '☎️ Contact Support']
        };
      }

      return {
        text: `📊 **System Overview & Full Statistics**:\n\n• 🏢 **Units**: 60 Units (Blocks A, B, C)\n• 👥 **Users**: 34 Accounts (Approved & Pending)\n• 🏊 **Facilities**: 8 Managed Amenities\n• 🚗 **Parking**: 66 Slots (60 Permanent, 6 Guest)\n• 🛠️ **Complaints**: 20 Maintenance Tickets\n• 📢 **Notices**: 15 Announcements\n• 💳 **Billing**: 25 Invoices (LKR 272,700 Collected)`,
        suggestions: MAIN_SUGGESTIONS
      };
    }

    // 6. How-To Guides
    if (/(how to|how do i|guide|help me|steps to|instructions)/.test(query)) {
      if (query.includes('complaint') || query.includes('issue') || query.includes('repair')) {
        return {
          text: `🛠️ **How to Submit a Maintenance Complaint**:\n1. Log in as Homeowner or Tenant.\n2. Navigate to **Dashboard -> Complaints**.\n3. Click **"+ Lodge Complaint"**.\n4. Select Category (Plumbing, Electrical, HVAC, etc.).\n5. Add Title & Description. Check "Emergency" if urgent.\n6. Submit — staff & maintenance team will be notified instantly!`,
          suggestions: ['🛠️ Complaint Stats', '🔧 Maintenance Team', '☎️ Contact Support']
        };
      }
      if (query.includes('facility') || query.includes('book') || query.includes('reserve') || query.includes('gym') || query.includes('pool')) {
        return {
          text: `📅 **How to Book a Facility / Amenity**:\n1. Go to **Facilities & Amenities** tab.\n2. Pick a facility (Pool, Gym, Hall, Tennis Court, etc.).\n3. Choose Date & Time Slot.\n4. Enter Purpose & Number of Participants.\n5. Click **"Submit Reservation Request"** for Staff review.`,
          suggestions: ['🏊 Facilities List', '☎️ Contact Support']
        };
      }
      if (query.includes('parking') || query.includes('visitor') || query.includes('guest')) {
        return {
          text: `🚗 **How to Request Visitor Guest Parking**:\n1. Navigate to **Parking Management**.\n2. Click **"Request Guest Parking"**.\n3. Fill in Visitor Name, Vehicle Number, Date & Arrival Time.\n4. Submit for instant staff verification and slot assignment.`,
          suggestions: ['🚗 Parking Info', '☎️ Contact Support']
        };
      }
      if (query.includes('bill') || query.includes('pay') || query.includes('invoice')) {
        return {
          text: `💳 **How to Pay Monthly Invoices & Bills**:\n1. Navigate to **Payments & Billing**.\n2. Review your unpaid invoice list.\n3. Click **"Pay Now"**.\n4. Select payment method (Online Payment, Card, or Bank Transfer).\n5. Complete transaction to issue instant receipt.`,
          suggestions: ['💳 Billing Overview', '☎️ Contact Support']
        };
      }
      if (query.includes('register') || query.includes('signup') || query.includes('account')) {
        return {
          text: `📝 **How to Register a New Resident Account**:\n1. Click **"Register Account"** on the Login page.\n2. Select your Role (Homeowner or Tenant).\n3. Complete Personal Info, NIC/Passport & Unit details.\n4. If Tenant, specify Owner's email.\n5. Submit for Admin/Staff approval.`,
          action: { label: 'Go to Registration Page', path: '/register' },
          suggestions: ['☎️ Contact Support']
        };
      }
    }

    // 7. Navigation Commands
    if (/(go to|navigate|open|take me to|show me|login|register|dashboard)/.test(query)) {
      if (query.includes('login')) {
        return {
          text: `🔑 Navigating to Login Page...`,
          action: { label: 'Go to Login Page', path: '/login' }
        };
      }
      if (query.includes('register') || query.includes('sign up')) {
        return {
          text: `📝 Navigating to Registration Page...`,
          action: { label: 'Go to Register', path: '/register' }
        };
      }
      if (query.includes('dashboard')) {
        return {
          text: `📊 Navigating to Dashboard...`,
          action: { label: 'Go to Dashboard', path: '/dashboard' }
        };
      }
    }

    // 8. UNRECOGNIZED MESSAGE HANDLER -> Show "Can't Recognize" + Complete Overview & All Options
    return {
      text: `🤖 **I couldn't quite recognize that query.**\n\nNo worries! Here is a complete overview of what I can help you with, along with all valuable options and sub-options:\n\n${SYSTEM_MENU_TEXT}`,
      suggestions: MAIN_SUGGESTIONS
    };
  };

  // Handle sending message
  const handleSendMessage = async (textToSend) => {
    const messageText = textToSend || inputMessage;
    if (!messageText.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking delay (400ms - 700ms)
    setTimeout(async () => {
      const response = await generateResponse(messageText);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response.text,
        contactLinks: response.contactLinks || false,
        suggestions: response.suggestions || null,
        action: response.action || null,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] font-sans select-none">
      {/* Floating Toggle Button (Bottom-Right Corner) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`group flex items-center gap-2.5 bg-[#133fbd] hover:bg-[#0f3299] text-white rounded-full shadow-2xl shadow-blue-950/40 border border-white/20 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer overflow-hidden ${
            isHovered ? 'px-4 py-3' : 'w-13 h-13 justify-center p-0'
          }`}
          title="Aura AI Assistant"
        >
          {/* Bot Icon with Online Pulse */}
          <div className="relative shrink-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#133fbd] rounded-full"></span>
          </div>

          {/* Expand Text ONLY on Hover */}
          {isHovered && (
            <div className="text-left whitespace-nowrap animate-in fade-in duration-200">
              <div className="text-xs font-black tracking-wide leading-tight">Aura AI Assistant</div>
              <div className="text-[10px] text-blue-200 font-medium">Ask System info & Help</div>
            </div>
          )}
          
          {isHovered && (
            <Sparkles className="w-4 h-4 text-amber-300 opacity-90 animate-pulse shrink-0" />
          )}
        </button>
      )}

      {/* Main Chatbot Window */}
      {isOpen && (
        <div
          className={`bg-white rounded-3xl shadow-2xl shadow-blue-950/30 border border-slate-200/80 flex flex-col transition-all duration-300 overflow-hidden ${
            isMinimized 
              ? 'w-[320px] h-[64px]' 
              : 'w-[350px] sm:w-[400px] h-[540px] max-h-[85vh]'
          }`}
        >
          {/* Chat Header */}
          <div className="bg-[#133fbd] text-white p-3.5 sm:p-4 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#133fbd] rounded-full"></span>
              </div>
              <div>
                <div className="text-sm font-black tracking-tight flex items-center gap-1.5">
                  <span>Aura Smart AI</span>
                  <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full font-extrabold uppercase text-blue-100">Live Bot</span>
                </div>
                <div className="text-[10px] text-blue-200 font-medium">
                  System Knowledge & Navigator
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Body (Hidden when minimized) */}
          {!isMinimized && (
            <>
              {/* Messages Container */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-slate-50/60 text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    {msg.text && (
                      <div
                        className={`max-w-[88%] p-3.5 rounded-2xl shadow-xs text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-[#133fbd] text-white rounded-br-none'
                            : 'bg-white text-slate-800 border border-slate-200/70 rounded-bl-none'
                        }`}
                      >
                        {/* Markdown text parsing */}
                        <div className="whitespace-pre-line">
                          {msg.text.split('\n').map((line, idx) => {
                            const parts = line.split(/(\*\*.*?\*\*|\`.*?\`)/g);
                            return (
                              <div key={idx} className={idx > 0 ? 'mt-1' : ''}>
                                {parts.map((part, pIdx) => {
                                  if (part.startsWith('**') && part.endsWith('**')) {
                                    return <strong key={pIdx} className="font-extrabold text-slate-900">{part.slice(2, -2)}</strong>;
                                  }
                                  if (part.startsWith('`') && part.endsWith('`')) {
                                    return <code key={pIdx} className="bg-blue-50 text-blue-800 border border-blue-200/60 font-mono px-1.5 py-0.5 rounded text-[11px] font-bold">{part.slice(1, -1)}</code>;
                                  }
                                  return part;
                                })}
                              </div>
                            );
                          })}
                        </div>

                        {/* Direct Contact Links */}
                        {msg.contactLinks && (
                          <div className="mt-3 space-y-2 border-t border-slate-100 pt-2.5">
                            <a
                              href="mailto:apartmentmanagementsystem123@gmail.com"
                              className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-bold rounded-xl border border-blue-200/70 transition shadow-2xs"
                            >
                              <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                              <span>Send Email Support</span>
                            </a>
                            <a
                              href="https://wa.me/94110123321"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-xl border border-emerald-200/70 transition shadow-2xs"
                            >
                              <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Chat on WhatsApp (+94 11 0123 321)</span>
                            </a>
                          </div>
                        )}

                        {/* Navigation Action Button */}
                        {msg.action && (
                          <button
                            onClick={() => {
                              navigate(msg.action.path);
                            }}
                            className="mt-3.5 w-full py-2 px-3 bg-[#133fbd] hover:bg-[#0f3299] text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                          >
                            <span>{msg.action.label}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {msg.time && (
                      <span className="text-[9px] font-semibold text-slate-400 mt-1 px-1">
                        {msg.time}
                      </span>
                    )}

                    {/* Suggestion Option Pills */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5 max-w-[95%]">
                        {msg.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSendMessage(sug)}
                            className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-blue-200/80 hover:border-blue-400 text-blue-700 text-[11px] font-bold rounded-full transition shadow-2xs cursor-pointer text-left flex items-center gap-1"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-slate-400 bg-white border border-slate-200/60 p-2.5 rounded-2xl w-fit rounded-bl-none shadow-2xs">
                    <Bot className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Footer */}
              <div className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Ask Aura AI anything or select an option..."
                  className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 transition"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim()}
                  className="w-8.5 h-8.5 bg-[#133fbd] hover:bg-[#0f3299] disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition shadow-sm cursor-pointer shrink-0"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
