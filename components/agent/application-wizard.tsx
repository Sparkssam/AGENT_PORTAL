"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Upload,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { WizardSteps } from "@/components/agent/wizard-steps"
import { formatCurrencyTZS } from "@/lib/admin-data"
import { currentAgent } from "@/lib/agent-data"
import { cn } from "@/lib/utils"

const steps = [
  { label: "Personal & Business" },
  { label: "Documents" },
  { label: "Deposit Payment" },
  { label: "Review & Submit" },
]

const requiredUploads = [
  { key: "id_front", name: "National ID Card (Front)" },
  { key: "id_back", name: "National ID Card (Back)" },
  { key: "tin", name: "Tax Identification Number (TIN)" },
  { key: "portrait", name: "Portrait / Passport Photo" },
  { key: "shop_image", name: "Shop Image" },
  { key: "contract", name: "Agreement Contract" },
]

interface FormState {
  fullName: string
  phone: string
  email: string
  idType: string
  idNumber: string
  gender: string
  businessName: string
  sector: string
  channel: string
  province: string
  district: string
  street: string
  depositReference: string
  notes: string
}

const initialForm: FormState = {
  fullName: currentAgent.fullName,
  phone: currentAgent.phone,
  email: currentAgent.email,
  idType: "",
  idNumber: "",
  gender: "",
  businessName: "",
  sector: "",
  channel: "",
  province: "",
  district: "",
  street: "",
  depositReference: "",
  notes: "",
}

export function ApplicationWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(initialForm)
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({})
  const [depositProof, setDepositProof] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const uploadedCount = requiredUploads.filter((d) => uploaded[d.key]).length
  const step1Valid = form.fullName && form.phone && form.email && form.idType && form.idNumber
  const step2Valid = uploadedCount === requiredUploads.length
  const step3Valid = form.depositReference.trim().length > 0 && depositProof

  function goNext() {
    if (step < steps.length) setStep((s) => s + 1)
  }
  function goBack() {
    if (step > 1) setStep((s) => s - 1)
  }

  function handleSubmit() {
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
    }, 900)
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-xl border border-border bg-card p-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-7" />
        </span>
        <h2 className="text-xl font-semibold text-foreground">Application submitted</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Thank you, {form.fullName.split(" ")[0]}. Your application has been received and is now pending
          review by our central team. You'll be notified as soon as there's an update.
        </p>
        <div className="mt-2 flex gap-3">
          <Button variant="outline" onClick={() => router.push("/agent/dashboard")}>
            Go to Dashboard
          </Button>
          <Button onClick={() => router.push("/agent/applications")}>View My Applications</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-card p-4 md:p-5">
        <WizardSteps steps={steps} current={step} />
      </div>

      <div className="rounded-xl border border-border bg-card">
        {step === 1 && (
          <div className="flex flex-col gap-6 p-5 md:p-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Personal &amp; Business Details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tell us about yourself and the agency you'll be operating.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className="h-10" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">Registered phone number</Label>
                <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="h-10" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="h-10" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gender">Gender</Label>
                <Select value={form.gender} onValueChange={(v) => update("gender", v ?? "")}>
                  <SelectTrigger id="gender" className="h-10 w-full">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="idType">ID type</Label>
                <Select value={form.idType} onValueChange={(v) => update("idType", v ?? "")}>
                  <SelectTrigger id="idType" className="h-10 w-full">
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="National ID (NIDA)">National ID (NIDA)</SelectItem>
                      <SelectItem value="Passport">Passport</SelectItem>
                      <SelectItem value="Driver's Licence">Driver&apos;s Licence</SelectItem>
                      <SelectItem value="Voter ID">Voter ID</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="idNumber">ID number</Label>
                <Input id="idNumber" value={form.idNumber} onChange={(e) => update("idNumber", e.target.value)} className="h-10" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="businessName">Business / shop name</Label>
                <Input id="businessName" value={form.businessName} onChange={(e) => update("businessName", e.target.value)} className="h-10" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sector">Business sector</Label>
                <Select value={form.sector} onValueChange={(v) => update("sector", v ?? "")}>
                  <SelectTrigger id="sector" className="h-10 w-full">
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Retail Kiosk">Retail Kiosk</SelectItem>
                      <SelectItem value="Supermarket">Supermarket</SelectItem>
                      <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                      <SelectItem value="Wholesale">Wholesale</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="channel">Channel</Label>
                <Select value={form.channel} onValueChange={(v) => update("channel", v ?? "")}>
                  <SelectTrigger id="channel" className="h-10 w-full">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                      <SelectItem value="Tigo Pesa">Tigo Pesa</SelectItem>
                      <SelectItem value="Airtel Money">Airtel Money</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="province">Province / region</Label>
                <Input id="province" value={form.province} onChange={(e) => update("province", e.target.value)} className="h-10" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="district">District</Label>
                <Input id="district" value={form.district} onChange={(e) => update("district", e.target.value)} className="h-10" />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="street">Street / area / landmark</Label>
                <Input id="street" value={form.street} onChange={(e) => update("street", e.target.value)} className="h-10" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6 p-5 md:p-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Required Documents</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload clear photos or PDFs of each document below. {uploadedCount} of {requiredUploads.length} uploaded.
              </p>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(uploadedCount / requiredUploads.length) * 100}%` }}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {requiredUploads.map((doc) => (
                <div
                  key={doc.key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    {uploaded[doc.key] ? (
                      <CheckCircle2 className="size-5 shrink-0 text-success" />
                    ) : (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/40" />
                    )}
                    <span className="text-sm text-foreground">{doc.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={uploaded[doc.key] ? "outline" : "default"}
                    onClick={() => setUploaded((prev) => ({ ...prev, [doc.key]: true }))}
                    disabled={uploaded[doc.key]}
                  >
                    {uploaded[doc.key] ? (
                      "Uploaded"
                    ) : (
                      <>
                        <Upload data-icon="inline-start" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6 p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Deposit Payment</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  A refundable deposit must be made from your registered mobile number to activate your
                  agent channel.
                </p>
              </div>
              <Wallet className="size-5 shrink-0 text-muted-foreground" />
            </div>

            <div className="flex flex-col justify-between gap-3 rounded-lg bg-secondary/60 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  Required amount
                </p>
                <p className="mt-1 font-mono text-3xl font-semibold tracking-tight text-foreground">
                  {formatCurrencyTZS(100000)}
                </p>
              </div>
              <span className="inline-flex w-fit items-center rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                Standard Tier
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="depositReference">Payment / transaction reference</Label>
              <Input
                id="depositReference"
                placeholder="e.g. TXN-88213-MP or MPESA-4A2E19"
                value={form.depositReference}
                onChange={(e) => update("depositReference", e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Enter the exact reference code from your mobile money or bank receipt. Ensure the deposit
                was made from the phone number associated with this application.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Deposit proof</Label>
              <button
                type="button"
                onClick={() => setDepositProof(true)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                  depositProof
                    ? "border-success/40 bg-success/5"
                    : "border-border hover:border-accent/40 hover:bg-secondary/40",
                )}
              >
                {depositProof ? (
                  <>
                    <CheckCircle2 className="size-6 text-success" />
                    <span className="text-sm font-medium text-foreground">Deposit-screenshot.png uploaded</span>
                  </>
                ) : (
                  <>
                    <Upload className="size-6 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Upload deposit screenshot</span>
                    <span className="text-xs text-muted-foreground">
                      Ensure the screenshot clearly shows the transaction details and your registered phone
                      number.
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-6 p-5 md:p-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Review &amp; Submit</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Please confirm your details below before submitting your application.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ReviewItem label="Full name" value={form.fullName} />
              <ReviewItem label="Phone" value={form.phone} />
              <ReviewItem label="Email" value={form.email} />
              <ReviewItem label="ID" value={`${form.idType || "—"} · ${form.idNumber || "—"}`} />
              <ReviewItem label="Business name" value={form.businessName || "—"} />
              <ReviewItem label="Sector" value={form.sector || "—"} />
              <ReviewItem label="Channel" value={form.channel || "—"} />
              <ReviewItem label="Location" value={[form.street, form.district, form.province].filter(Boolean).join(", ") || "—"} />
              <ReviewItem label="Documents uploaded" value={`${uploadedCount} of ${requiredUploads.length}`} />
              <ReviewItem label="Deposit reference" value={form.depositReference || "—"} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Additional notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Anything else the review team should know?"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <Button variant="outline" onClick={goBack} disabled={step === 1}>
          <ArrowLeft data-icon="inline-start" />
          Back
        </Button>

        <p className="hidden text-sm text-muted-foreground sm:block">
          {step === 1 && !step1Valid && "Complete the required fields to continue"}
          {step === 2 && !step2Valid && `${requiredUploads.length - uploadedCount} document(s) remaining`}
          {step === 3 && !step3Valid && "Enter your transaction reference and upload proof to continue"}
        </p>

        {step < steps.length ? (
          <Button
            onClick={goNext}
            disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid) || (step === 3 && !step3Valid)}
          >
            Next: {steps[step].label}
            <ArrowRight data-icon="inline-end" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check data-icon="inline-start" />
                Submit Application
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  )
}
