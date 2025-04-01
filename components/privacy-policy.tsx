"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useProfile } from "@/hooks/use-profile"
import { useToast } from "@/hooks/use-toast"

export function PrivacyPolicy() {
  const { profile, acceptPrivacyPolicy } = useProfile()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Show privacy policy dialog if user hasn't accepted it yet
    if (profile && !profile.privacyAccepted) {
      setOpen(true)
    }
  }, [profile])

  const handleAccept = async () => {
    setIsSubmitting(true)

    try {
      const success = await acceptPrivacyPolicy()

      if (success) {
        setOpen(false)
        toast({
          title: "Privacy Policy Accepted",
          description: "Thank you for accepting our privacy policy",
        })
      } else {
        throw new Error("Failed to accept privacy policy")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        // Prevent closing the dialog by clicking outside
        if (profile && !profile.privacyAccepted) {
          return
        }
        setOpen(value)
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
          <DialogDescription>
            Please read and accept our privacy policy to continue using the application.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] p-4 border rounded-md">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. Introduction</h3>
            <p>
              Welcome to Me2You. We respect your privacy and are committed to protecting your personal data. This
              privacy policy will inform you about how we look after your personal data when you visit our website and
              tell you about your privacy rights and how the law protects you.
            </p>

            <h3 className="text-lg font-semibold">2. Data We Collect</h3>
            <p>We collect and process the following information:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Personal identification information (Name, email address, profile picture)</li>
              <li>Contact information and messages you exchange with other users</li>
              <li>Content you share in stories</li>
              <li>Your location (if provided)</li>
              <li>Usage data and activity on our platform</li>
            </ul>

            <h3 className="text-lg font-semibold">3. How We Use Your Data</h3>
            <p>We use your data to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide and maintain our service</li>
              <li>Enable communication between users</li>
              <li>Improve and personalize your experience</li>
              <li>Notify you about updates and changes</li>
              <li>Detect and prevent fraud and abuse</li>
            </ul>

            <h3 className="text-lg font-semibold">4. Data Sharing</h3>
            <p>We share your information with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Other users (as necessary for the service to function)</li>
              <li>Service providers who help us operate our platform</li>
              <li>Law enforcement when required by law</li>
            </ul>

            <h3 className="text-lg font-semibold">5. Data Security</h3>
            <p>
              We implement appropriate security measures to protect your personal data against unauthorized access,
              alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic
              storage is 100% secure, and we cannot guarantee absolute security.
            </p>

            <h3 className="text-lg font-semibold">6. Your Rights</h3>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Request restriction of processing</li>
              <li>Request transfer of your data</li>
              <li>Withdraw consent at any time</li>
            </ul>

            <h3 className="text-lg font-semibold">7. Changes to This Policy</h3>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page and updating the "Last updated" date.
            </p>

            <h3 className="text-lg font-semibold">8. Contact Us</h3>
            <p>If you have any questions about this Privacy Policy, please contact us at privacy@me2you.com.</p>

            <p className="text-sm text-muted-foreground pt-4">Last updated: March 31, 2025</p>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button type="button" onClick={handleAccept} disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "I Accept"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

