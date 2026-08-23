import { MotionConfig } from "motion/react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { Retailers } from "@/components/Retailers";
import { Tracking } from "@/components/Tracking";
import { About } from "@/components/About";
import { Testimonial } from "@/components/Testimonial";
import { WhyUs } from "@/components/WhyUs";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-1 flex-col">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <Services />
          <Retailers />
          <Tracking />
          <About />
          <Testimonial />
          <WhyUs />
          <Contact />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}
