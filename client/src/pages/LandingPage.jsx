import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Star,
  MapPin,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  QrCode,
  Search,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  Users,
  Check,
  ChevronDown,
  ChevronUp,
  Bot,
  Globe,
  Award,
  Phone,
  Mail,
  Menu,
  X,
  ExternalLink,
  Laptop,
  CheckSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleReviewsSection } from '../components/reviews/GoogleReviewsSection.jsx';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Navigation
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live Demo Interactive Tabs
  const [activeTab, setActiveTab] = useState('geogrid'); // 'geogrid', 'ai_reply', 'deflection', 'multiloc'

  // Interactive Geo-Grid Scanner State
  const [gridRadius, setGridRadius] = useState(5);
  const [gridKeyword, setGridKeyword] = useState('best fine dining restaurant');

  // Interactive AI Reply State
  const [aiTone, setAiTone] = useState('warm');
  const [copiedReply, setCopiedReply] = useState(false);

  // Interactive ROI Calculator State
  const [locationsCount, setLocationsCount] = useState(3);
  const [monthlyCustomers, setMonthlyCustomers] = useState(350);
  const [avgTicketSize, setAvgTicketSize] = useState(1500);

  // Pricing Toggle State
  const [annualBilling, setAnnualBilling] = useState(true);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // ROI Calculations
  const estimatedNewReviewsPerMonth = Math.round(monthlyCustomers * 0.12 * locationsCount);
  const estimatedRevenueLiftAnnual = Math.round(
    locationsCount * monthlyCustomers * avgTicketSize * 12 * 0.085
  );

  const toneReplies = {
    warm: "Thank you so very much, Vikram! We are overjoyed to hear that the Dal Saffron Special and our royal tasting menu made your family celebration unforgettable. Our executive chef and hospitality team look forward to welcoming you back for another exquisite evening soon!",
    professional: "Dear Vikram, thank you for your valuable feedback regarding your dining experience at Saffron Fine Dine. We are pleased our culinary quality and service standards met your high expectations. We appreciate your patronage and look forward to serving you again.",
    casual: "Thanks a ton for the amazing review, Vikram! So glad you loved the Dal Saffron Special and the atmosphere. Can't wait to have you and your family back at the table soon!"
  };

  const geoPins = [
    { id: 1, rank: 1, label: 'Bodakdev', color: 'emerald' },
    { id: 2, rank: 1, label: 'Thaltej', color: 'emerald' },
    { id: 3, rank: 2, label: 'Sindhu Bhavan', color: 'emerald' },
    { id: 4, rank: 2, label: 'Vastrapur', color: 'emerald' },
    { id: 5, rank: 3, label: 'Prahlad Nagar', color: 'emerald' },
    { id: 6, rank: 4, label: 'Satellite', color: 'amber' },
    { id: 7, rank: 5, label: 'Ambli Road', color: 'amber' },
    { id: 8, rank: 7, label: 'South Bopal', color: 'amber' },
    { id: 9, rank: 11, label: 'Navrangpura', color: 'rose' }
  ];

  const faqs = [
    {
      q: "How does Redes Creation protect our business from negative Google reviews?",
      a: "Our smart QR review campaigns feature an automated 2-way sentiment deflection funnel. Customers giving 4 or 5 stars are immediately guided to post directly onto your public Google Profile. Customers rating 1-3 stars are routed to a private management resolution form, allowing your staff to solve the issue directly before any public harm occurs."
    },
    {
      q: "Are the AI-generated review responses compliant with Google policies?",
      a: "Yes. Every single response is generated strictly according to your customized Business Intelligence Profile and niche-specific compliance guidelines. For healthcare and dental practices, our system strictly enforces HIPAA privacy rules (never confirming clinical treatment details). For dining, allergen verification guardrails are built in."
    },
    {
      q: "How does the 5x5 Geo-Grid Heatmap rank tracking work?",
      a: "Traditional rank checkers show a single generic position for an entire city. Redes Creation simulates real GPS searches at multiple geographic coordinates around your physical storefront or service territory, giving you an exact color-coded pin map showing where you rank in the top 3-Pack and where competitors are overtaking you."
    },
    {
      q: "Can I manage multiple business locations or client accounts in one place?",
      a: "Absolutely. Redes Creation is built from the ground up on a multi-tenant PostgreSQL 18 architecture. You can switch between dozens or hundreds of storefront locations in one click, assign granular RBAC roles (Owner, Admin, SEO Manager, Staff, Client Portal), and generate white-label PDF reports with your own agency branding."
    },
    {
      q: "How long does onboarding take?",
      a: "Less than 2 minutes. Our guided onboarding wizard configures your business identity, target services, customer personas, brand voice, and Google Business Profile connection seamlessly. Your initial Local SEO audit and Geo-Grid scan run instantly."
    },
    {
      q: "Can I cancel or change plans at any time?",
      a: "Yes. There are no lock-in contracts. You can upgrade, downgrade, or cancel your subscription at any time directly inside the Billing settings with immediate effect."
    }
  ];

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-[#034bc0] selection:text-white">
      {/* TOP NOTIFICATION / TRUST STRIP */}
      <div className="bg-[#034bc0] text-white text-[11px] sm:text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <span className="bg-white/20 text-white px-2 py-0.5 rounded-full font-bold uppercase text-[10px]">New</span>
        <span>Google Review Automation + 5x5 Geo-Grid Heatmap Engine is now live!</span>
        <Link to="/register" className="underline font-bold hover:text-blue-100 hidden sm:inline ml-1">
          Start 14-Day Free Trial →
        </Link>
      </div>

      {/* FLOATING PILL NAVBAR (Inspired by redescreation.in) */}
      <div className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8">
        <header className="max-w-6xl mx-auto bg-white/95 backdrop-blur-md rounded-full shadow-[0_4px_25px_rgba(0,0,0,0.07)] border border-slate-200/80 px-5 sm:px-7 py-3 flex items-center justify-between transition-all">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/redes-logo.png"
              alt="Redes Creation"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <button onClick={() => scrollToSection('features')} className="hover:text-[#034bc0] transition-colors cursor-pointer">
              Services
            </button>
            <button onClick={() => scrollToSection('showcase')} className="hover:text-[#034bc0] transition-colors cursor-pointer">
              Live Demo
            </button>
            <button onClick={() => scrollToSection('calculator')} className="hover:text-[#034bc0] transition-colors cursor-pointer">
              ROI Calculator
            </button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-[#034bc0] transition-colors cursor-pointer">
              Pricing
            </button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-[#034bc0] transition-colors cursor-pointer">
              FAQ
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#034bc0] to-[#0140b3] hover:from-[#0140b3] hover:to-[#034bc0] text-white font-bold text-xs shadow-md shadow-blue-700/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-[#034bc0] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#034bc0] to-[#0140b3] hover:from-[#0140b3] hover:to-[#034bc0] text-white font-bold text-xs shadow-md shadow-blue-700/20 flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 border border-slate-200"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col space-y-2.5 text-sm font-semibold text-slate-700">
              <button onClick={() => scrollToSection('features')} className="text-left py-2 hover:text-[#034bc0]">Services</button>
              <button onClick={() => scrollToSection('showcase')} className="text-left py-2 hover:text-[#034bc0]">Live Demo</button>
              <button onClick={() => scrollToSection('calculator')} className="text-left py-2 hover:text-[#034bc0]">ROI Calculator</button>
              <button onClick={() => scrollToSection('pricing')} className="text-left py-2 hover:text-[#034bc0]">Pricing</button>
              <button onClick={() => scrollToSection('faq')} className="text-left py-2 hover:text-[#034bc0]">FAQ</button>
            </div>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-2.5 rounded-full bg-[#034bc0] text-white font-bold text-xs text-center"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="w-full py-2.5 text-center text-xs font-semibold text-slate-700 bg-slate-100 rounded-full"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="w-full py-2.5 text-center text-xs font-bold text-white bg-[#034bc0] rounded-full shadow-md shadow-blue-700/20"
                  >
                    Start 14-Day Free Trial
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* HERO SECTION */}
      <section className="pt-16 pb-16 lg:pt-24 lg:pb-24 overflow-hidden relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#034bc0] text-xs font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Google Review & Local SEO Intelligence SaaS</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-500 font-bold flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-500" /> 4.9 / 5.0
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
            Dominate Google Local 3-Pack. <br />
            <span className="text-[#034bc0]">Automate 5-Star Reviews</span> with Enterprise AI.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            The simple, powerful local search intelligence platform for restaurants, dental clinics, retail storefronts, and digital agencies. Boost rankings, deflect negative feedback, and reply to reviews automatically.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#034bc0] hover:bg-[#0140b3] text-white font-bold text-xs shadow-lg shadow-blue-700/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => scrollToSection('showcase')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Live Demo</span>
              <ArrowUpRight className="w-4 h-4 text-[#034bc0]" />
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium pt-2">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> 2-minute onboarding</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> Google Verified API</span>
          </div>

          {/* Key Metrics Banner */}
          <div className="pt-10 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <strong className="text-2xl lg:text-3xl font-extrabold text-[#034bc0] block">1,200+</strong>
              <span className="text-xs text-slate-500 font-medium">Businesses Protected</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <strong className="text-2xl lg:text-3xl font-extrabold text-emerald-600 block">+340%</strong>
              <span className="text-xs text-slate-500 font-medium">Review Velocity Lift</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <strong className="text-2xl lg:text-3xl font-extrabold text-[#034bc0] block">#1.8</strong>
              <span className="text-xs text-slate-500 font-medium">Avg Local 3-Pack Rank</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <strong className="text-2xl lg:text-3xl font-extrabold text-slate-800 block">99.9%</strong>
              <span className="text-xs text-slate-500 font-medium">System Uptime</span>
            </div>
          </div>
        </div>
      </section>

      {/* CORE SERVICES & CAPABILITIES (Clean Cards) */}
      <section id="features" className="py-16 lg:py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#034bc0] uppercase tracking-wider">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything Needed to Win in Local Search
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Simple, reliable tools built specifically to elevate your Google Business Profile and dominate local competition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#034bc0]/40 transition-all hover:shadow-md space-y-3">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-[#034bc0] flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">5x5 Geo-Grid SERP Heatmap</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scan local 3-Pack rank visibility across neighborhood grid coordinates with variable radii from 1km to 25km. See exactly where your customers find you.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#034bc0]/40 transition-all hover:shadow-md space-y-3">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-[#034bc0] flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Multi-Industry AI Auto-Responder</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pre-trained on dining, healthcare, dental, hospitality, and retail. Formats custom warm, professional, or casual replies with strict safety guardrails.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#034bc0]/40 transition-all hover:shadow-md space-y-3">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-[#034bc0] flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">QR Code Review Campaigns</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate printable QR codes with built-in 2-way sentiment deflection. 5-star guests post to Google, while unhappy guests are intercepted privately.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#034bc0]/40 transition-all hover:shadow-md space-y-3">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-[#034bc0] flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Competitor SERP Benchmarking</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track top local competitors, review volume velocity, ratings drift, and keyword rank conquests side-by-side on an intuitive graph.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#034bc0]/40 transition-all hover:shadow-md space-y-3">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-[#034bc0] flex items-center justify-center font-bold">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Automated SEO Audits & Kanban Tasks</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Continuous Google Business audits with 1-click conversion to collaborative Kanban task boards for your team and agency staff.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#034bc0]/40 transition-all hover:shadow-md space-y-3">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-[#034bc0] flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Multi-Location & Agency Portal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seamless multi-tenant architecture. Manage single clinics or 100+ restaurant franchises with granular RBAC permissions and client logins.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE PRODUCT DEMO SANDBOX */}
      <section id="showcase" className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#034bc0] uppercase tracking-wider">
              Live Product Demo
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Test the Platform Live
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Click the tabs below to try out interactive simulations.
            </p>
          </div>

          {/* Simple Tab Switcher */}
          <div className="flex items-center justify-center p-1 bg-white border border-slate-200 rounded-full max-w-xl mx-auto shadow-sm">
            <button
              onClick={() => setActiveTab('geogrid')}
              className={`flex-1 py-2 px-3 rounded-full text-xs font-bold transition cursor-pointer ${
                activeTab === 'geogrid' ? 'bg-[#034bc0] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Geo-Grid Heatmap
            </button>
            <button
              onClick={() => setActiveTab('ai_reply')}
              className={`flex-1 py-2 px-3 rounded-full text-xs font-bold transition cursor-pointer ${
                activeTab === 'ai_reply' ? 'bg-[#034bc0] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              AI Review Replies
            </button>
            <button
              onClick={() => setActiveTab('deflection')}
              className={`flex-1 py-2 px-3 rounded-full text-xs font-bold transition cursor-pointer ${
                activeTab === 'deflection' ? 'bg-[#034bc0] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Review Deflection
            </button>
            <button
              onClick={() => setActiveTab('multiloc')}
              className={`flex-1 py-2 px-3 rounded-full text-xs font-bold transition cursor-pointer ${
                activeTab === 'multiloc' ? 'bg-[#034bc0] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Multi-Location
            </button>
          </div>

          {/* Tab 1: Geo-Grid Heatmap */}
          {activeTab === 'geogrid' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">5x5 Hyper-Local GPS Heatmap</h3>
                  <p className="text-xs text-slate-500">Target Location: Western Ahmedabad (Bodakdev / SG Highway)</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Scan Radius:</span>
                  {[3, 5, 10].map(r => (
                    <button
                      key={r}
                      onClick={() => setGridRadius(r)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        gridRadius === r ? 'bg-[#034bc0] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {r}km
                    </button>
                  ))}
                </div>
              </div>

              {/* Pins Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-3 gap-3">
                    {geoPins.map((pin) => (
                      <div
                        key={pin.id}
                        className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center bg-white ${
                          pin.color === 'emerald'
                            ? 'border-emerald-200 text-emerald-800'
                            : pin.color === 'amber'
                            ? 'border-amber-200 text-amber-800'
                            : 'border-rose-200 text-rose-800'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                          pin.color === 'emerald' ? 'bg-emerald-600' : pin.color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
                        }`}>
                          #{pin.rank}
                        </div>
                        <span className="text-xs font-bold text-slate-900 mt-1.5">{pin.label}</span>
                        <span className="text-[10px] text-slate-500">{gridRadius}km sector</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-200">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Rank 1–3 (3-Pack)</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Rank 4–9 (Local)</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Rank 10+ (Opportunity)</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Telemetry Score</h4>
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Average 3-Pack Rank</span>
                      <strong className="text-emerald-700 text-xl font-extrabold">#1.8</strong>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Local 3-Pack Dominance</span>
                      <strong className="text-[#034bc0] text-xl font-extrabold">78.4%</strong>
                    </div>
                  </div>

                  <Link
                    to="/register"
                    className="w-full py-2.5 rounded-lg bg-[#034bc0] hover:bg-[#0140b3] text-white text-xs font-bold text-center block transition shadow-sm"
                  >
                    Scan Your Storefront
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: AI Review Replies */}
          {activeTab === 'ai_reply' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Simulate Tone-Customized AI Review Reply</h3>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
                  <button
                    onClick={() => setAiTone('warm')}
                    className={`px-3 py-1 rounded font-semibold transition cursor-pointer ${
                      aiTone === 'warm' ? 'bg-white text-[#034bc0] shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    Warm
                  </button>
                  <button
                    onClick={() => setAiTone('professional')}
                    className={`px-3 py-1 rounded font-semibold transition cursor-pointer ${
                      aiTone === 'professional' ? 'bg-white text-[#034bc0] shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    Professional
                  </button>
                  <button
                    onClick={() => setAiTone('casual')}
                    className={`px-3 py-1 rounded font-semibold transition cursor-pointer ${
                      aiTone === 'casual' ? 'bg-white text-[#034bc0] shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    Casual
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Incoming Review */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-xs text-slate-900 block font-bold">Vikramaditya Singhania</strong>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        ))}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400">Google Review</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-lg border border-slate-200">
                    "Celebrated my parents' 30th anniversary at Saffron Fine Dine. The Dal Saffron Special was out of this world, and the hospitality by Mr. Rohan was exceptional. Private banquet seating was flawless. Will definitely return!"
                  </p>
                </div>

                {/* AI Drafted Reply */}
                <div className="p-5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#034bc0] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> AI Draft ({aiTone.toUpperCase()} Tone)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Policy Check: PASSED
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed bg-white p-3.5 rounded-lg border border-blue-100 min-h-[90px]">
                      {toneReplies[aiTone]}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setCopiedReply(true);
                      setTimeout(() => setCopiedReply(false), 2000);
                    }}
                    className="w-full py-2 rounded-lg bg-[#034bc0] hover:bg-[#0140b3] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{copiedReply ? 'Copied to Clipboard!' : 'Approve & Publish to Google'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Negative Review Deflection */}
          {activeTab === 'deflection' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-900">2-Way Smart Sentiment Deflection Funnel</h3>
                <p className="text-xs text-slate-500">
                  Customers scan QR stand on tables or bills. System dynamically routes feedback based on star rating.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="p-6 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                      5★
                    </div>
                    <div>
                      <strong className="text-sm font-bold text-slate-900 block">Happy Guests (4–5 Stars)</strong>
                      <span className="text-xs text-emerald-700 font-medium">Auto-directed to Google Profile</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Customer taps 5 stars. System provides 1-click praise prompts and opens the Google Business write review screen in 1 second.
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-rose-50/60 border border-rose-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-rose-600 text-white font-bold flex items-center justify-center text-sm">
                      1★
                    </div>
                    <div>
                      <strong className="text-sm font-bold text-slate-900 block">Unhappy Guests (1–3 Stars)</strong>
                      <span className="text-xs text-rose-700 font-medium">Private Management Form</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Customer feedback is sent securely to store manager's WhatsApp / Email for immediate resolution, keeping public star rating safe.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Multi-Location */}
          {activeTab === 'multiloc' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Multi-Location Switcher Demo</h3>
                <span className="text-xs text-slate-500 font-medium">PostgreSQL 18 Multi-Tenant Isolation</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#034bc0] uppercase">Storefront Location 1</span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">Saffron Fine Dine & Banquets</h4>
                      <p className="text-xs text-slate-500">Bodakdev, SG Highway • Restaurant</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-emerald-600 block">94.5%</span>
                      <span className="text-[10px] text-slate-400">Health Score</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Rating</span>
                      <strong className="text-slate-800">4.8★</strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Reply Speed</span>
                      <strong className="text-emerald-600">2.4h</strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">3-Pack Pins</span>
                      <strong className="text-[#034bc0]">6 terms</strong>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Storefront Location 2</span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">Apex Dental Spa & Implant Center</h4>
                      <p className="text-xs text-slate-500">Sindhu Bhavan Road • Healthcare</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-blue-600 block">88.0%</span>
                      <span className="text-[10px] text-slate-400">Health Score</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Rating</span>
                      <strong className="text-slate-800">4.7★</strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Reply Speed</span>
                      <strong className="text-emerald-600">3.1h</strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">HIPAA</span>
                      <strong className="text-emerald-600">Active</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ROI CALCULATOR SECTION */}
      <section id="calculator" className="py-16 lg:py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#034bc0] uppercase tracking-wider">
              ROI Calculator
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Calculate Your Reputation ROI
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              See the projected annual revenue impact of ranking in Google's Local 3-Pack.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 sm:p-10 max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center shadow-sm">
            {/* Sliders */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Storefront Locations</span>
                  <span className="text-[#034bc0] font-extrabold">{locationsCount} {locationsCount === 1 ? 'Location' : 'Locations'}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={locationsCount}
                  onChange={(e) => setLocationsCount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#034bc0]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Monthly Customers / Guests</span>
                  <span className="text-[#034bc0] font-extrabold">{monthlyCustomers} guests</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={monthlyCustomers}
                  onChange={(e) => setMonthlyCustomers(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#034bc0]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Average Customer Ticket Spend</span>
                  <span className="text-[#034bc0] font-extrabold">₹{avgTicketSize.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={avgTicketSize}
                  onChange={(e) => setAvgTicketSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#034bc0]"
                />
              </div>
            </div>

            {/* Display */}
            <div className="bg-white border border-slate-200 p-8 rounded-xl text-center space-y-5 shadow-sm">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Estimated Projected Annual Lift
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#034bc0] mt-1.5">
                  +₹{estimatedRevenueLiftAnnual.toLocaleString('en-IN')}
                  <span className="text-xs text-slate-500 block font-normal mt-0.5">per year in revenue</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">New 5★ Reviews</span>
                  <strong className="text-emerald-700 text-base">+{estimatedNewReviewsPerMonth}/mo</strong>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Hours Saved</span>
                  <strong className="text-[#034bc0] text-base">+{locationsCount * 4}h/wk</strong>
                </div>
              </div>

              <Link
                to="/register"
                className="w-full py-3 rounded-full bg-[#034bc0] hover:bg-[#0140b3] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-blue-700/20"
              >
                <span>Unlock This Growth</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* REAL GOOGLE REVIEWS SECTION */}
      <GoogleReviewsSection
        title="Genuine Customer Experiences on Google"
        subtitle="Real ratings, total reviews, and authentic customer feedback pulled directly from Google Maps Platform."
      />

      {/* PRICING SECTION */}
      <section id="pricing" className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#034bc0] uppercase tracking-wider">
              Transparent Pricing
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Simple, Predictable Plans
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Start with a 14-day free trial. No credit card required.
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-full text-xs font-semibold mt-2 shadow-sm">
              <button
                onClick={() => setAnnualBilling(false)}
                className={`px-4 py-1.5 rounded-full transition cursor-pointer ${
                  !annualBilling ? 'bg-[#034bc0] text-white font-bold' : 'text-slate-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnualBilling(true)}
                className={`px-4 py-1.5 rounded-full transition flex items-center gap-1 cursor-pointer ${
                  annualBilling ? 'bg-[#034bc0] text-white font-bold' : 'text-slate-600'
                }`}
              >
                <span>Annual</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                  SAVE 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Plan 1 */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Starter</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">₹{annualBilling ? '2,999' : '3,499'}</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <p className="text-xs text-slate-600">
                  Ideal for single storefronts, independent clinics, or boutique cafes.
                </p>

                <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> 1 Physical Storefront</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> 3x3 Geo-Grid Rank Scanner</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> 50 AI Review Replies / Mo</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> 3 Printable QR Review Codes</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Google Business Profile Sync</div>
                </div>
              </div>

              <Link
                to="/register"
                className="w-full py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs text-center transition"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Plan 2: Pro */}
            <div className="p-7 rounded-2xl bg-white border-2 border-[#034bc0] shadow-lg shadow-blue-700/10 flex flex-col justify-between space-y-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#034bc0] text-white">
                  MOST POPULAR
                </span>
              </div>

              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#034bc0]">Professional Growth</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">₹{annualBilling ? '6,999' : '8,999'}</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <p className="text-xs text-slate-600">
                  For growing businesses ready to aggressively dominate local Google 3-Packs.
                </p>

                <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-800 font-medium">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#034bc0]" /> Up to 5 Business Locations</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#034bc0]" /> 5x5 Geo-Grid SERP Scanner</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#034bc0]" /> Unlimited AI Review Replies</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#034bc0]" /> 2-Way Review Deflection Funnel</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#034bc0]" /> SEO Audits & Kanban Tasks</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#034bc0]" /> Competitor Benchmarking</div>
                </div>
              </div>

              <Link
                to="/register"
                className="w-full py-2.5 rounded-full bg-[#034bc0] hover:bg-[#0140b3] text-white font-bold text-xs text-center shadow-md shadow-blue-700/20 transition"
              >
                Claim Professional 14-Day Free
              </Link>
            </div>

            {/* Plan 3: Agency */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Agency Enterprise</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">₹{annualBilling ? '19,999' : '24,999'}</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <p className="text-xs text-slate-600">
                  White-label suite for digital marketing agencies, hotel chains, and clinic networks.
                </p>

                <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Unlimited Storefront Locations</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> 7x7 Multi-Radius Geo-Grid Scans</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Complete White-Label PDF Reports</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> RBAC & Client Portal Accounts</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Priority 24/7 Support</div>
                </div>
              </div>

              <Link
                to="/register"
                className="w-full py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs text-center transition"
              >
                Start Enterprise Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-16 lg:py-24 bg-white border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#034bc0] uppercase tracking-wider">
              FAQ
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Clear answers to help you get started quickly.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200/90 overflow-hidden bg-slate-50/60 transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/70"
                  >
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{faq.q}</span>
                    <div className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL HIGH-IMPACT CTA BANNER */}
      <section className="py-16 lg:py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-[#034bc0] to-[#0140b3] p-8 sm:p-14 text-center text-white space-y-6 shadow-xl shadow-blue-900/20">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Win in Google Local Search?
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto">
              Join 1,200+ local brands, hospitalities, and healthcare clinics using Redes Creation to dominate their local market.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-[#034bc0] font-extrabold text-xs shadow-md hover:bg-blue-50 transition"
              >
                Start 14-Day Free Trial
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-blue-800/60 text-white border border-blue-400/40 font-bold text-xs hover:bg-blue-800/80 transition"
              >
                Instant Demo Sign In
              </Link>
            </div>
            <p className="text-[11px] text-blue-200">
              No credit card required • Cancel anytime • 2-minute setup
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER (Aligned with Redes Creation Pvt Ltd branding) */}
      <footer className="bg-white border-t border-slate-200 py-12 text-xs text-slate-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 space-y-3">
              <Link to="/" className="inline-block">
                <img
                  src="/redes-logo.png"
                  alt="Redes Creation"
                  className="h-9 w-auto object-contain"
                />
              </Link>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Redes Creation Pvt Ltd provides cutting-edge Web Development, ERP Systems, SEO & Local Intelligence Solutions in India, UAE, USA & UK.
              </p>
              <div className="text-[11px] text-slate-500 space-y-1">
                <p>📍 Abu Road, Sirohi, Rajasthan / Ahmedabad, India</p>
                <p>📞 Phone: +91 98250 12345</p>
                <p>✉️ Email: info@redescreation.in</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 uppercase text-xs">Capabilities</h4>
              <ul className="space-y-1.5 text-slate-500">
                <li><button onClick={() => scrollToSection('showcase')} className="hover:text-[#034bc0]">Geo-Grid Heatmap</button></li>
                <li><button onClick={() => scrollToSection('showcase')} className="hover:text-[#034bc0]">AI Review Auto-Replies</button></li>
                <li><button onClick={() => scrollToSection('showcase')} className="hover:text-[#034bc0]">QR Deflection Funnel</button></li>
                <li><button onClick={() => scrollToSection('showcase')} className="hover:text-[#034bc0]">Local SEO Audits</button></li>
                <li><button onClick={() => scrollToSection('calculator')} className="hover:text-[#034bc0]">ROI Calculator</button></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 uppercase text-xs">Services</h4>
              <ul className="space-y-1.5 text-slate-500">
                <li><a href="https://redescreation.in/website-designing-development.php" target="_blank" rel="noreferrer" className="hover:text-[#034bc0]">Website Development</a></li>
                <li><a href="https://redescreation.in/erp-software-development.php" target="_blank" rel="noreferrer" className="hover:text-[#034bc0]">ERP Software</a></li>
                <li><a href="https://redescreation.in/seo-services.php" target="_blank" rel="noreferrer" className="hover:text-[#034bc0]">SEO & Digital Marketing</a></li>
                <li><a href="https://redescreation.in/mobile-app-development.php" target="_blank" rel="noreferrer" className="hover:text-[#034bc0]">Mobile Apps</a></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 uppercase text-xs">Platform</h4>
              <ul className="space-y-1.5 text-slate-500">
                <li><Link to="/login" className="hover:text-[#034bc0]">Sign In</Link></li>
                <li><Link to="/register" className="hover:text-[#034bc0]">Create Workspace</Link></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-[#034bc0]">Pricing Plans</button></li>
                <li><button onClick={() => scrollToSection('faq')} className="hover:text-[#034bc0]">FAQ</button></li>
                <li><a href="http://localhost:5000/health" target="_blank" rel="noreferrer" className="hover:text-[#034bc0]">API Health Status</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} Redes Creation Pvt Ltd. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="https://redescreation.in" target="_blank" rel="noreferrer" className="hover:text-[#034bc0]">redescreation.in</a>
              <span>•</span>
              <span className="hover:text-slate-700 cursor-pointer">Privacy Policy</span>
              <span>•</span>
              <span className="hover:text-slate-700 cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
