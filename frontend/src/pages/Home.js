import React from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Highlights from "../components/Highlights";
import Features from "../components/Features";
import Footer from "../components/Footer";
import Encouragement from "../components/Encouragement";
import AnimatedSection from "../components/AnimatedSection";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Hero />

 <AnimatedSection/>

        <Encouragement />
        {/* Separate Highlights section under Hero */}
       
        
        <Features />
       
        <Highlights />
      </main>
      <Footer />
    </div>
  );
}
