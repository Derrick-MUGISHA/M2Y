"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { MessageSquare, Users, Image, Bell, Lock, Shield, Zap, Sparkles } from "lucide-react"
import { FeatureCard } from "@/components/features/feature-card"
// import { FeatureCard } from "@/components/features/feature-card"

export default function FeaturesPage() {
  const features = [
    {
      icon: MessageSquare,
      title: "Real-Time Messaging",
      description: "Send and receive messages instantly with friends and groups.",
      color: "blue",
    },
    {
      icon: Users,
      title: "Group Chats",
      description: "Create groups with friends and family for seamless communication.",
      color: "green",
    },
    {
      icon: Image,
      title: "Media Sharing",
      description: "Share photos, videos, and documents with optimized quality.",
      color: "purple",
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Get notified about new messages and important updates.",
      color: "orange",
    },
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "Your messages are secure with advanced encryption.",
      color: "red",
    },
    {
      icon: Shield,
      title: "Data Backup",
      description: "Backup and restore your chat history and media.",
      color: "teal",
    },
    {
      icon: Zap,
      title: "Voice Notes",
      description: "Record and send voice messages with high-quality audio.",
      color: "amber",
    },
    {
      icon: Sparkles,
      title: "Self-Destructing Messages",
      description: "Send messages that automatically delete after a set time.",
      color: "pink",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center mb-4">
          <motion.div
            className="rounded-full bg-primary/10 p-3 flex items-center justify-center"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 2,
              repeatType: "reverse",
            }}
          >
            <MessageSquare className="h-8 w-8 text-primary" />
          </motion.div>
        </div>
        <h1 className="text-4xl font-bold mb-4">Me 2 You</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A secure, feature-rich messaging platform for connecting with friends and family.
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button asChild size="lg">
            <Link href="/register">Get Started</Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            color={feature.color}
          />
        ))}
      </div>

      <motion.div
        className="mt-16 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-muted-foreground mb-8">Join thousands of users already enjoying Me 2 You.</p>
        <Button asChild size="lg">
          <Link href="/register">Create an Account</Link>
        </Button>
      </motion.div>
    </div>
  )
}

