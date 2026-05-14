"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  Menu, 
  X, 
  ArrowRight, 
  Leaf, 
  TreeDeciduous, 
  Hammer, 
  HandMetal, 
  Droplets,
  Sparkles,
  Quote,
  Mail,
  MapPin,
  Phone,
  Clock,
  Instagram,
  Facebook,
  Twitter
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Navigation Component
function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#craftsmanship", label: "Craftsmanship" },
    { href: "#collection", label: "Collection" },
    { href: "#workshop", label: "Workshop" },
    { href: "#philosophy", label: "Philosophy" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-[var(--cream)]/95 backdrop-blur-md shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <a href="#" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10">
                <Image
                  src="/images/logo-crest.png?v=3"
                  alt="RootGrain Logo"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="flex flex-col">
                <span className={`font-serif text-xl font-semibold tracking-wide ${
                  isScrolled ? "text-[var(--walnut)]" : "text-[var(--ivory)]"
                }`}>
                  ROOTGRAIN
                </span>
                <span className={`text-[10px] tracking-[0.3em] uppercase ${
                  isScrolled ? "text-[var(--walnut-light)]" : "text-[var(--ivory)]/70"
                }`}>
                  Artisan Furniture
                </span>
              </div>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium tracking-wide transition-colors hover:text-[var(--gold)] ${
                    isScrolled ? "text-[var(--walnut)]" : "text-[var(--ivory)]"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* CTA Button */}
            <div className="hidden lg:block">
              <Button
                variant="outline"
                className={`border-2 rounded-none px-6 py-2 text-sm tracking-wider uppercase font-medium transition-all hover:bg-[var(--walnut)] hover:text-[var(--ivory)] hover:border-[var(--walnut)] ${
                  isScrolled
                    ? "border-[var(--walnut)] text-[var(--walnut)]"
                    : "border-[var(--ivory)] text-[var(--ivory)]"
                }`}
              >
                Visit Atelier
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`lg:hidden p-2 ${
                isScrolled ? "text-[var(--walnut)]" : "text-[var(--ivory)]"
              }`}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[var(--walnut-dark)]"
          >
            <div className="flex flex-col h-full p-6">
              <div className="flex justify-end">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-[var(--ivory)] p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 gap-8">
                {navLinks.map((link, index) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-serif text-3xl text-[var(--ivory)] hover:text-[var(--gold)] transition-colors"
                  >
                    {link.label}
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Hero Section
function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} className="relative h-screen min-h-[700px] overflow-hidden">
      {/* Background Image */}
      <motion.div style={{ y }} className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--walnut-dark)]/60 via-[var(--walnut-dark)]/40 to-[var(--cream)] z-10" />
        <Image
          src="/images/hero-workshop.png"
          alt="RootGrain Artisan Workshop"
          fill
          className="object-cover"
          priority
        />
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-20 h-full flex flex-col items-center justify-center text-center px-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mb-6"
        >
          <span className="text-[var(--gold-light)] text-sm tracking-[0.4em] uppercase font-medium">
            Heritage Artisan Furniture
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="font-serif text-5xl md:text-7xl lg:text-8xl text-[var(--ivory)] font-light leading-tight mb-8 max-w-5xl"
        >
          Crafted with{" "}
          <span className="italic font-normal">Legacy</span>
          <br />
          Not Manufactured
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="text-[var(--ivory)]/80 text-lg md:text-xl max-w-2xl mb-12 font-light leading-relaxed"
        >
          Each piece tells a story of timeless craftsmanship, premium hardwoods, 
          and the patient hands that shape them into heirlooms for generations.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button className="bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--walnut-dark)] px-8 py-6 rounded-none text-sm tracking-wider uppercase font-semibold">
            Explore Collection
          </Button>
          <Button
            variant="outline"
            className="border-[var(--ivory)]/30 text-[var(--ivory)] hover:bg-[var(--ivory)]/10 px-8 py-6 rounded-none text-sm tracking-wider uppercase"
          >
            Our Craft
          </Button>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-[var(--ivory)]/60"
        >
          <span className="text-xs tracking-[0.2em] uppercase">Discover</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// Craftsmanship Section
function CraftsmanshipSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const crafts = [
    {
      icon: <TreeDeciduous className="w-8 h-8" />,
      title: "Wood Selection",
      description: "Each timber is hand-selected for its unique grain patterns, density, and character. We source from sustainable forests, choosing only the finest hardwoods that will age beautifully for generations.",
    },
    {
      icon: <HandMetal className="w-8 h-8" />,
      title: "Hand Sanding",
      description: "Every surface is meticulously hand-sanded through multiple grit progressions, revealing the wood's natural luster and creating a silk-smooth finish that invites touch.",
    },
    {
      icon: <Hammer className="w-8 h-8" />,
      title: "Traditional Joinery",
      description: "We employ centuries-old joinery techniques—mortise and tenon, dovetails, and hand-cut joints—that create bonds stronger than the wood itself, ensuring structural integrity for lifetimes.",
    },
    {
      icon: <Droplets className="w-8 h-8" />,
      title: "Oil Finishing",
      description: "Multiple coats of premium linseed oil and beeswax are hand-rubbed into the wood, nourishing the fibers and creating a living finish that develops a rich patina over time.",
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Final Detailing",
      description: "Every edge is softened, every corner refined. Our artisans spend hours on final touches that transform furniture into functional art, with attention to details both seen and felt.",
    },
    {
      icon: <Leaf className="w-8 h-8" />,
      title: "Quality Assurance",
      description: "Each piece undergoes rigorous inspection before leaving our workshop. We stand behind every creation with a lifetime guarantee on craftsmanship and materials.",
    },
  ];

  return (
    <section
      id="craftsmanship"
      ref={ref}
      className="py-24 lg:py-32 bg-[var(--cream)] grain-overlay"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-[var(--gold)] text-sm tracking-[0.4em] uppercase font-medium mb-4 block">
            The Art of Making
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[var(--walnut-dark)] font-light mb-6">
            Craftsmanship
          </h2>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent mx-auto mb-8" />
          <p className="text-[var(--walnut-light)] text-lg max-w-2xl mx-auto leading-relaxed">
            Our furniture is born from patience, skill, and an unwavering commitment 
            to the traditions of fine woodworking. Each piece passes through the hands 
            of master craftsmen who have dedicated their lives to this ancient art.
          </p>
        </motion.div>

        {/* Crafts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {crafts.map((craft, index) => (
            <motion.div
              key={craft.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group p-8 bg-[var(--ivory)] border border-[var(--border)] hover:border-[var(--gold)] transition-all duration-500 hover-lift"
            >
              <div className="text-[var(--gold)] mb-6 group-hover:scale-110 transition-transform duration-500">
                {craft.icon}
              </div>
              <h3 className="font-serif text-2xl text-[var(--walnut-dark)] mb-4">
                {craft.title}
              </h3>
              <p className="text-[var(--walnut-light)] leading-relaxed">
                {craft.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-20 relative aspect-[21/9] overflow-hidden"
        >
          <Image
            src="/images/craftsmanship-detail.png"
            alt="Artisan hands at work"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--walnut-dark)]/40 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <p className="font-serif text-2xl text-[var(--ivory)] max-w-xl">
              "The hand that shapes the wood leaves its mark on the soul of the piece."
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Signature Collection Section
function SignatureCollectionSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const products = [
    {
      name: "The Heritage Dining Table",
      category: "Dining Tables",
      price: "$4,800",
      wood: "American Black Walnut",
      dimensions: '84" L × 42" W × 30" H',
      image: "/images/product-dining-table.png",
      description: "A centerpiece for gathering, crafted with sweeping grain patterns and sculptural organic edges.",
    },
    {
      name: "The Artisan Coffee Table",
      category: "Coffee Tables",
      price: "$2,200",
      wood: "White Oak",
      dimensions: '48" L × 24" W × 16" H',
      image: "/images/product-coffee-table.png",
      description: "Low and elegant, with rounded edges that soften any living space.",
    },
    {
      name: "The Heritage Chair",
      category: "Seating",
      price: "$1,600",
      wood: "Walnut",
      dimensions: '22" W × 20" D × 34" H',
      image: "/images/product-chair.png",
      description: "Ergonomic comfort meets timeless design, with visible joinery and hand-shaped spindles.",
    },
    {
      name: "The Sculptural Bench",
      category: "Seating",
      price: "$2,400",
      wood: "Walnut",
      dimensions: '60" L × 16" D × 18" H',
      image: "/images/product-bench.png",
      description: "A statement piece for entryways or dining spaces, with fluid organic form.",
    },
    {
      name: "The Tea Table",
      category: "Tables",
      price: "$1,800",
      wood: "Cherry",
      dimensions: '36" L × 24" W × 14" H',
      image: "/images/product-tea-table.png",
      description: "Low and refined, perfect for quiet moments and intimate gatherings.",
    },
    {
      name: "The Console Table",
      category: "Tables",
      price: "$2,000",
      wood: "White Oak",
      dimensions: '48" L × 14" D × 32" H',
      image: "/images/product-console.png",
      description: "Architectural elegance for hallways and entryways, with clean lines and warm presence.",
    },
  ];

  return (
    <section
      id="collection"
      ref={ref}
      className="py-24 lg:py-32 bg-[var(--ivory)]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-[var(--gold)] text-sm tracking-[0.4em] uppercase font-medium mb-4 block">
            Heirloom Quality
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[var(--walnut-dark)] font-light mb-6">
            Signature Collection
          </h2>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent mx-auto mb-8" />
          <p className="text-[var(--walnut-light)] text-lg max-w-2xl mx-auto leading-relaxed">
            Each piece in our signature collection represents the pinnacle of our craft—
            timeless designs that honor the natural beauty of premium hardwoods.
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[4/5] overflow-hidden mb-6 bg-[var(--parchment)]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[var(--walnut-dark)]/0 group-hover:bg-[var(--walnut-dark)]/10 transition-colors duration-500" />
                <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <Button className="w-full bg-[var(--ivory)] text-[var(--walnut-dark)] hover:bg-[var(--gold)] rounded-none py-4 text-sm tracking-wider uppercase">
                    View Details
                  </Button>
                </div>
              </div>
              <div>
                <span className="text-[var(--gold)] text-xs tracking-[0.2em] uppercase">
                  {product.category}
                </span>
                <h3 className="font-serif text-xl text-[var(--walnut-dark)] mt-1 mb-2 group-hover:text-[var(--oxblood)] transition-colors">
                  {product.name}
                </h3>
                <p className="text-[var(--walnut-light)] text-sm mb-3 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--walnut)]">{product.wood}</span>
                  <span className="font-serif text-lg text-[var(--walnut-dark)]">{product.price}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <Button
            variant="outline"
            className="border-[var(--walnut)] text-[var(--walnut)] hover:bg-[var(--walnut)] hover:text-[var(--ivory)] px-8 py-6 rounded-none text-sm tracking-wider uppercase"
          >
            View Complete Collection
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

// Workshop Story Section
function WorkshopStorySection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="workshop"
      ref={ref}
      className="py-24 lg:py-32 bg-[var(--walnut-dark)] text-[var(--ivory)]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <span className="text-[var(--gold)] text-sm tracking-[0.4em] uppercase font-medium mb-4 block">
              Our Story
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-light mb-8 leading-tight">
              Where Tradition
              <br />
              <span className="italic">Meets Tomorrow</span>
            </h2>
            <div className="w-24 h-px bg-gradient-to-r from-[var(--gold)] to-transparent mb-8" />
            
            <div className="space-y-6 text-[var(--ivory)]/80 leading-relaxed">
              <p>
                In a sunlit workshop nestled among old-growth forests, our artisans continue 
                a tradition that spans generations. Here, the scent of fresh-cut hardwood mingles 
                with the quiet rhythm of hand tools, and each piece of furniture begins its 
                journey from raw timber to heirloom treasure.
              </p>
              <p>
                Every RootGrain piece carries the marks of its makers—the careful selection of 
                grain, the patient hours of sanding, the precision of hand-cut joints. These are 
                not imperfections; they are the signatures of authenticity, proof that human 
                hands guided every step of creation.
              </p>
              <p>
                We believe that in an age of disposable goods, there is profound value in 
                furniture designed to outlive its makers. Each table, chair, and bench we 
                create is built to become a cherished part of your family's story, passed 
                down through generations as a testament to enduring quality.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-8">
              <div>
                <div className="font-serif text-4xl text-[var(--gold)]">25+</div>
                <div className="text-sm text-[var(--ivory)]/60 mt-1">Years of Heritage</div>
              </div>
              <div>
                <div className="font-serif text-4xl text-[var(--gold)]">12</div>
                <div className="text-sm text-[var(--ivory)]/60 mt-1">Master Artisans</div>
              </div>
              <div>
                <div className="font-serif text-4xl text-[var(--gold)]">3,000+</div>
                <div className="text-sm text-[var(--ivory)]/60 mt-1">Heirlooms Created</div>
              </div>
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src="/images/workshop-interior.png"
                alt="RootGrain Workshop"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--walnut-dark)]/60 to-transparent" />
            </div>
            {/* Decorative frame */}
            <div className="absolute -top-4 -left-4 w-full h-full border border-[var(--gold)]/30 -z-10" />
            <div className="absolute -bottom-4 -right-4 w-full h-full border border-[var(--gold)]/30 -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Material Philosophy Section
function MaterialPhilosophySection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="philosophy"
      ref={ref}
      className="py-24 lg:py-32 bg-[var(--cream)] grain-overlay"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-[var(--gold)] text-sm tracking-[0.4em] uppercase font-medium mb-4 block">
            Our Materials
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[var(--walnut-dark)] font-light mb-6">
            Material Philosophy
          </h2>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent mx-auto mb-8" />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative aspect-square overflow-hidden">
              <Image
                src="/images/material-wood-grain.png"
                alt="Premium hardwood grain detail"
                fill
                className="object-cover"
              />
            </div>
            {/* Accent */}
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-[var(--parchment)] -z-10" />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <div className="space-y-8">
              <div>
                <h3 className="font-serif text-2xl text-[var(--walnut-dark)] mb-3">
                  Premium Hardwoods
                </h3>
                <p className="text-[var(--walnut-light)] leading-relaxed">
                  We work exclusively with sustainably sourced American Black Walnut, 
                  White Oak, Cherry, and Maple—hardwoods chosen for their exceptional 
                  beauty, durability, and ability to develop rich patinas over time. 
                  Each board is hand-selected for its unique grain story.
                </p>
              </div>

              <div>
                <h3 className="font-serif text-2xl text-[var(--walnut-dark)] mb-3">
                  Natural Finishes
                </h3>
                <p className="text-[var(--walnut-light)] leading-relaxed">
                  Our furniture is finished with food-safe linseed oil and beeswax, 
                  allowing the wood to breathe and develop character with age. Unlike 
                  polyurethane, these natural finishes can be refreshed and renewed, 
                  ensuring your piece grows more beautiful with each passing year.
                </p>
              </div>

              <div>
                <h3 className="font-serif text-2xl text-[var(--walnut-dark)] mb-3">
                  Aging Gracefully
                </h3>
                <p className="text-[var(--walnut-light)] leading-relaxed">
                  We embrace the natural aging process of wood—the way cherry darkens 
                  to rich red-brown, how walnut deepens in color, the gentle wear 
                  patterns that tell the story of a life well-lived. These are not 
                  flaws to be feared, but the authentic marks of time that transform 
                  furniture into family heirlooms.
                </p>
              </div>

              <div className="pt-4">
                <Button
                  variant="outline"
                  className="border-[var(--walnut)] text-[var(--walnut)] hover:bg-[var(--walnut)] hover:text-[var(--ivory)] px-6 py-5 rounded-none text-sm tracking-wider uppercase"
                >
                  Learn About Our Woods
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Lifestyle Interiors Section
function LifestyleInteriorsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="py-24 lg:py-32 bg-[var(--ivory)]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-[var(--gold)] text-sm tracking-[0.4em] uppercase font-medium mb-4 block">
            Living with RootGrain
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[var(--walnut-dark)] font-light mb-6">
            Lifestyle Interiors
          </h2>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent mx-auto mb-8" />
          <p className="text-[var(--walnut-light)] text-lg max-w-2xl mx-auto leading-relaxed">
            Our furniture finds its home in spaces that value authenticity, warmth, 
            and the quiet luxury of natural materials.
          </p>
        </motion.div>

        {/* Large Image */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
          className="relative aspect-[21/9] overflow-hidden mb-8"
        >
          <Image
            src="/images/lifestyle-interior.png"
            alt="RootGrain furniture in a warm Japandi-style interior"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--walnut-dark)]/30 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
            <div>
              <p className="text-[var(--ivory)]/70 text-sm tracking-wider uppercase mb-2">Featured Space</p>
              <p className="font-serif text-2xl text-[var(--ivory)]">A Japandi Dining Room</p>
            </div>
            <Button className="bg-[var(--ivory)] text-[var(--walnut-dark)] hover:bg-[var(--gold)] rounded-none px-6 py-4 text-sm tracking-wider uppercase">
              Explore Spaces
            </Button>
          </div>
        </motion.div>

        {/* Two Column Images */}
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative aspect-[4/3] overflow-hidden group cursor-pointer"
          >
            <Image
              src="/images/craft-finishing.png"
              alt="Artisan finishing process"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-[var(--walnut-dark)]/0 group-hover:bg-[var(--walnut-dark)]/20 transition-colors duration-500" />
            <div className="absolute bottom-6 left-6">
              <p className="font-serif text-xl text-[var(--ivory)]">The Finishing Touch</p>
              <p className="text-[var(--ivory)]/70 text-sm mt-1">Hand-rubbed oil finishes</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative aspect-[4/3] overflow-hidden group cursor-pointer"
          >
            <Image
              src="/images/product-decor.png"
              alt="Artisan home decor pieces"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-[var(--walnut-dark)]/0 group-hover:bg-[var(--walnut-dark)]/20 transition-colors duration-500" />
            <div className="absolute bottom-6 left-6">
              <p className="font-serif text-xl text-[var(--ivory)]">Artisan Decor</p>
              <p className="text-[var(--ivory)]/70 text-sm mt-1">Handcrafted home accessories</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const testimonials = [
    {
      quote: "Our dining table has become the heart of our home. Every meal feels special when gathered around something made with such care and intention. The wood grain tells a story, and now our family does too.",
      author: "Sarah & James Morrison",
      location: "Portland, Oregon",
      piece: "Heritage Dining Table",
    },
    {
      quote: "In a world of disposable furniture, finding RootGrain was like discovering a treasure. The bench we purchased will outlive us all, and that's exactly the point. This is furniture as it should be.",
      author: "David Chen",
      location: "San Francisco, California",
      piece: "Sculptural Bench",
    },
    {
      quote: "The coffee table is stunning—elegant yet approachable, refined yet warm. But what I love most is knowing the hands that shaped it. There's soul in every curve.",
      author: "Emma Thompson",
      location: "Austin, Texas",
      piece: "Artisan Coffee Table",
    },
  ];

  return (
    <section
      ref={ref}
      className="py-24 lg:py-32 bg-[var(--parchment)]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-[var(--gold)] text-sm tracking-[0.4em] uppercase font-medium mb-4 block">
            Words From Our Collectors
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[var(--walnut-dark)] font-light mb-6">
            Testimonials
          </h2>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent mx-auto" />
        </motion.div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="p-8 bg-[var(--ivory)] border border-[var(--border)] relative"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-[var(--gold)]/20" />
              <p className="text-[var(--walnut)] leading-relaxed mb-6 italic">
                "{testimonial.quote}"
              </p>
              <div className="border-t border-[var(--border)] pt-6">
                <p className="font-serif text-lg text-[var(--walnut-dark)]">
                  {testimonial.author}
                </p>
                <p className="text-sm text-[var(--walnut-light)] mt-1">
                  {testimonial.location}
                </p>
                <p className="text-xs text-[var(--gold)] mt-2 tracking-wider uppercase">
                  {testimonial.piece}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  const [email, setEmail] = useState("");

  return (
    <footer id="contact" className="bg-[var(--walnut-dark)] text-[var(--ivory)]">
      {/* Newsletter Section */}
      <div className="border-b border-[var(--ivory)]/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="font-serif text-3xl mb-4">
                Join the RootGrain Circle
              </h3>
              <p className="text-[var(--ivory)]/70 max-w-md">
                Receive stories from our workshop, early access to new collections, 
                and insights into the art of fine woodworking.
              </p>
            </div>
            <div className="flex gap-4">
              <Input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-[var(--ivory)]/30 text-[var(--ivory)] placeholder:text-[var(--ivory)]/50 rounded-none py-6 focus:border-[var(--gold)]"
              />
              <Button className="bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--walnut-dark)] px-8 rounded-none whitespace-nowrap">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-12 h-12">
                <Image
                  src="/images/logo-crest.png?v=3"
                  alt="RootGrain Logo"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div>
                <span className="font-serif text-xl tracking-wide block">ROOTGRAIN</span>
                <span className="text-[10px] tracking-[0.3em] uppercase text-[var(--ivory)]/60">
                  Artisan Furniture
                </span>
              </div>
            </div>
            <p className="text-[var(--ivory)]/60 text-sm leading-relaxed mb-6">
              Handcrafted heirloom furniture for those who value authenticity, 
              craftsmanship, and the timeless beauty of natural wood.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-[var(--ivory)]/60 hover:text-[var(--gold)] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-[var(--ivory)]/60 hover:text-[var(--gold)] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-[var(--ivory)]/60 hover:text-[var(--gold)] transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg mb-6">Explore</h4>
            <ul className="space-y-3 text-[var(--ivory)]/60 text-sm">
              <li><a href="#collection" className="hover:text-[var(--gold)] transition-colors">Signature Collection</a></li>
              <li><a href="#craftsmanship" className="hover:text-[var(--gold)] transition-colors">Our Craftsmanship</a></li>
              <li><a href="#workshop" className="hover:text-[var(--gold)] transition-colors">Workshop Story</a></li>
              <li><a href="#philosophy" className="hover:text-[var(--gold)] transition-colors">Material Philosophy</a></li>
              <li><a href="#" className="hover:text-[var(--gold)] transition-colors">Custom Commissions</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-serif text-lg mb-6">Categories</h4>
            <ul className="space-y-3 text-[var(--ivory)]/60 text-sm">
              <li><a href="#" className="hover:text-[var(--gold)] transition-colors">Dining Tables</a></li>
              <li><a href="#" className="hover:text-[var(--gold)] transition-colors">Coffee Tables</a></li>
              <li><a href="#" className="hover:text-[var(--gold)] transition-colors">Chairs & Seating</a></li>
              <li><a href="#" className="hover:text-[var(--gold)] transition-colors">Console Tables</a></li>
              <li><a href="#" className="hover:text-[var(--gold)] transition-colors">Home Decor</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-lg mb-6">Visit Our Atelier</h4>
            <ul className="space-y-4 text-[var(--ivory)]/60 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[var(--gold)] flex-shrink-0 mt-0.5" />
                <span>1247 Artisan Way<br />Portland, Oregon 97201</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[var(--gold)] flex-shrink-0" />
                <span>(503) 555-0147</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[var(--gold)] flex-shrink-0" />
                <span>atelier@rootgrain.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[var(--gold)] flex-shrink-0" />
                <span>Tue–Sat: 10am–6pm</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[var(--ivory)]/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[var(--ivory)]/40 text-sm">
            © 2024 RootGrain. All rights reserved. Crafted with legacy.
          </p>
          <div className="flex gap-8 text-[var(--ivory)]/40 text-sm">
            <a href="#" className="hover:text-[var(--ivory)] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[var(--ivory)] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[var(--ivory)] transition-colors">Care Guide</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main Page Component
export default function RootGrainHome() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <HeroSection />
      <CraftsmanshipSection />
      <SignatureCollectionSection />
      <WorkshopStorySection />
      <MaterialPhilosophySection />
      <LifestyleInteriorsSection />
      <TestimonialsSection />
      <Footer />
    </main>
  );
}
