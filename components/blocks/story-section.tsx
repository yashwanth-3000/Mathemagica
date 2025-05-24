"use client";

import { motion } from "framer-motion";
import { Sparkles, DivideSquare } from "lucide-react";

const storyContent = {
  title: "Welcome to Mathemagica!",
  paragraphs: [
    "Ever felt math was a bit... dry? Or maybe even a little daunting? What if you could explore tricky concepts like fractions, algebra, and geometry not through dense textbooks, but through vibrant comics packed with adventure and fun characters? That's the magic behind Mathemagica!",
    "Each chapter in our interactive comic series, 'Mathemagica: The Comic Chronicles', transforms a core math concept into an exciting story. Join our heroes as they solve mysteries with geometry, navigate treacherous paths with fractions, and unlock secrets with algebra. Learning math becomes an engaging quest!",
    "We believe that understanding is built on enjoyment and visual connection. These comics aren't just about finding 'x'; they're about discovering the 'why' and the 'wow' of mathematics. So turn the page, dive into the stories, and get ready to see math in a whole new light!"
  ],
  quote: {
    text: "Mathematics is not about numbers, equations, computations, or algorithms: it is about understanding.",
    author: "William Paul Thurston"
  }
};

export function StorySection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3, duration: 0.5 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, y: 0,
      transition: { type: "spring", stiffness: 100, damping: 12 }
    }
  };

  return (
    <motion.section 
      className="py-16 md:py-24 mt-12 md:mt-16"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="container mx-auto px-4 max-w-3xl text-center md:text-left">
        <motion.div variants={itemVariants} className="flex justify-center md:justify-start mb-6">
          <Sparkles className="h-10 w-10 text-amber-500 dark:text-amber-400" />
        </motion.div>

        <motion.h2 
          variants={itemVariants}
          className="text-3xl md:text-4xl font-semibold text-stone-800 dark:text-stone-100 mb-8 leading-tight"
        >
          {storyContent.title}
        </motion.h2>

        <motion.div variants={itemVariants} className="space-y-6 text-stone-700 dark:text-stone-300 text-md md:text-lg leading-relaxed font-serif">
          {storyContent.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </motion.div>

        <motion.div 
          variants={itemVariants} 
          className="mt-12 pt-8 border-t border-stone-300 dark:border-stone-700 text-center"
        >
          <DivideSquare className="h-8 w-8 text-amber-600 dark:text-amber-500 mx-auto mb-4 opacity-80" />
          <p className="text-xl md:text-2xl italic text-stone-600 dark:text-stone-400 font-serif leading-snug">
            "{storyContent.quote.text}"
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-500 mt-3 tracking-wide">
            &mdash; {storyContent.quote.author}
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
} 