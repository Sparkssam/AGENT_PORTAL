"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Crosshair,
  Pencil,
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
import { formatCurrencyTZS } from "@/lib/format"
import type { Application, Document } from "@/lib/domain"
import { formatDateLong, formatDateTime, formatGps, formatPhoneTZ } from "@/lib/format"
import { type AgentProfile } from "@/lib/agent-data"
import { cn } from "@/lib/utils"
import { saveDraft, submitApplication } from "@/lib/actions/applications"
import { upsertDeposit } from "@/lib/actions/deposits"
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog"
import { SupportingDocumentsList } from "@/components/documents/supporting-documents-list"
import { HelpHint } from "@/components/help/help-hint"
import { documentSlotProgress, isFilledDocumentStatus } from "@/lib/documents/catalog"
import {
  BUSINESS_SECTORS,
  CHANNEL_MANAGER_NAME,
  CHANNEL_MANAGER_TYPES,
  CHANNEL_PARENT_NAME,
  CHANNEL_PARENT_TYPE,
  CHANNEL_TIER,
  ID_TYPES,
  NETWORK_CHANNELS,
  isAllowedIdType,
  isChannelManagerType,
} from "@/lib/lookups/catalog"

const steps = [
  { label: "Personal & Business" },
  { label: "Documents" },
  { label: "Deposit Payment" },
  { label: "Review & Submit" },
]

const skipWizardGates = process.env.NODE_ENV === "development"

function mergeNetworkChannels(lookups: LookupItem[]) {
  return NETWORK_CHANNELS.map((network) => {
    const found = lookups.find((item) => {
      const name = item.name.toLowerCase()
      const code = item.code.toLowerCase()
      return (
        name === network.name.toLowerCase() ||
        code === network.code.toLowerCase() ||
        network.aliases.some((alias) => alias.toLowerCase() === name)
      )
    })
    return {
      id: found?.id ?? network.name,
      name: network.name,
      code: found?.code ?? network.code,
    }
  })
}

const defaultSectors = BUSINESS_SECTORS.map((item) => ({
  id: item.code,
  name: item.name,
  code: item.code,
}))

interface FormState {
  fullName: string
  phone: string
  email: string
  idType: string
  idNumber: string
  issuedPlace: string
  issuedDate: string
  expireDate: string
  gender: string
  country: string
  businessName: string
  sector: string
  channel: string
  channelParentType: string
  channelParentName: string
  channelManagerType: string
  channelManagerName: string
  channelType: string
  province: string
  district: string
  ward: string
  street: string
  houseNumber: string
  tinNumber: string
  depositReference: string
  notes: string
  lat?: number
  lng?: number
  locationAccuracy?: number
  locationCapturedAt?: string
}

interface LookupItem {
  id: string
  name: string
  code: string
}

function dateInputValue(value?: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10)
  return date.toISOString().slice(0, 10)
}

function hasCoords(lat?: number, lng?: number) {
  return typeof lat === "number" && typeof lng === "number" && !(lat === 0 && lng === 0)
}

function expiryWarning(value?: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000)
  if (days < 0) return "This ID has expired — admins will flag this."
  if (days <= 90) return "This ID will expire soon — admins may flag this."
  return null
}

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string
  children: ReactNode
  required?: boolean
}) {
  return (
    <Label htmlFor={htmlFor} className="gap-0.5 text-[13px] font-medium text-foreground">
      {children}
      {required ? <span className="text-destructive">*</span> : null}
    </Label>
  )
}

function Field({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex flex-col gap-2", className)}>{children}</div>
}

const controlClass = "h-12"

export function ApplicationWizard({
  agent,
  application,
  lookups,
  live = false,
}: {
  agent: AgentProfile
  application?: Application
  lookups?: { channels: LookupItem[]; sectors: LookupItem[] }
  live?: boolean
}) {
  const router = useRouter()
  const channels = mergeNetworkChannels(lookups?.channels ?? [])
  const sectors = lookups?.sectors.length ? lookups.sectors : defaultSectors
  const defaultSectorId = sectors.find((item) => item.code === "all")?.id ?? sectors[0]?.id ?? ""
  const [step, setStep] = useState(1)
  const [applicationId, setApplicationId] = useState(application?.id !== "draft" ? application?.id : undefined)
  const [docs, setDocs] = useState<Document[]>(application?.documents ?? [])
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadType, setUploadType] = useState<string | undefined>()
  const [form, setForm] = useState<FormState>({
    fullName: application?.agentName || agent.fullName,
    phone: agent.phone,
    email: application?.email || agent.email,
    idType: isAllowedIdType(application?.idType) ? application.idType : "",
    idNumber: application?.idNumber ?? "",
    issuedPlace: application?.issuedPlace ?? "",
    issuedDate: dateInputValue(application?.issuedDate),
    expireDate: dateInputValue(application?.expireDate),
    gender: application?.gender ?? "",
    country: application?.country || "Tanzania",
    businessName: agent.fullName,
    sector: application?.sectorId || application?.sector || defaultSectorId,
    channel: application?.channelId || application?.channel || "",
    channelParentType: CHANNEL_PARENT_TYPE,
    channelParentName: CHANNEL_PARENT_NAME,
    channelManagerType: isChannelManagerType(application?.channelManagerType)
      ? application.channelManagerType
      : "",
    channelManagerName: CHANNEL_MANAGER_NAME,
    channelType: CHANNEL_TIER,
    province: application?.province ?? "",
    district: application?.district ?? "",
    ward: application?.ward ?? "",
    street: application?.street ?? "",
    houseNumber: application?.houseNumber ?? "",
    tinNumber: application?.tinNumber ?? "",
    depositReference: application?.depositReference ?? "",
    notes: "",
    lat: hasCoords(application?.lat, application?.lng) ? application?.lat : undefined,
    lng: hasCoords(application?.lat, application?.lng) ? application?.lng : undefined,
    locationCapturedAt: application?.locationCapturedAt,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedNumber, setSubmittedNumber] = useState<string | null>(null)
  const [usedTestSubmit, setUsedTestSubmit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savingRef = useRef(false)
  const skipAutosaveRef = useRef(true)
  const lastSavedRef = useRef("")

  const docsProgress = documentSlotProgress(docs)
  const depositProof = docs.some((doc) => doc.type === "deposit_proof" && isFilledDocumentStatus(doc.status))
  const uploadedCount = docsProgress.requiredUploaded
  const requiredCount = docsProgress.requiredTotal

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const capturedLocation = hasCoords(form.lat, form.lng)
  const missingRequiredDocs = docsProgress.slots.filter(
    (doc) => doc.required !== false && (doc.status === "missing" || doc.status === "rejected"),
  )
  const step1Valid = Boolean(
    form.fullName &&
      form.phone &&
      form.email &&
      form.channelParentName &&
      form.channelManagerType &&
      form.channelManagerName &&
      form.channelType &&
      form.businessName &&
      form.idType &&
      form.idNumber &&
      form.issuedPlace &&
      form.issuedDate &&
      form.expireDate &&
      form.sector &&
      form.channel &&
      form.gender &&
      form.country &&
      form.province &&
      form.district &&
      form.ward &&
      form.street &&
      form.houseNumber &&
      capturedLocation,
  )
  const idExpiryNote = expiryWarning(form.expireDate)
  const step2Valid = docsProgress.remaining === 0 && requiredCount > 0
  const step3Valid = form.depositReference.trim().length > 0 && depositProof
  const canSubmit = step1Valid && step2Valid && step3Valid

  async function persistDraft(patch: Partial<FormState> = form) {
    if (!live) return applicationId
    const saved = await saveDraft({
      fullName: String(patch.fullName ?? form.fullName),
      phone: agent.phone,
      email: String(patch.email ?? form.email),
      idType: String(patch.idType ?? form.idType),
      idNumber: String(patch.idNumber ?? form.idNumber),
      issuedPlace: String(patch.issuedPlace ?? form.issuedPlace),
      issuedDate: String(patch.issuedDate ?? form.issuedDate),
      expireDate: String(patch.expireDate ?? form.expireDate),
      gender: String(patch.gender ?? form.gender),
      country: String(patch.country ?? form.country),
      businessName: agent.fullName,
      sector: String(patch.sector ?? form.sector),
      channel: String(patch.channel ?? form.channel),
      channelParentType: CHANNEL_PARENT_TYPE,
      channelParentName: CHANNEL_PARENT_NAME,
      channelManagerType: String(patch.channelManagerType ?? form.channelManagerType),
      channelManagerName: CHANNEL_MANAGER_NAME,
      channelType: CHANNEL_TIER,
      province: String(patch.province ?? form.province),
      district: String(patch.district ?? form.district),
      ward: String(patch.ward ?? form.ward),
      street: String(patch.street ?? form.street),
      houseNumber: String(patch.houseNumber ?? form.houseNumber),
      tinNumber: String(patch.tinNumber ?? form.tinNumber),
      notes: String(patch.notes ?? form.notes),
      lat: typeof patch.lat === "number" ? patch.lat : form.lat,
      lng: typeof patch.lng === "number" ? patch.lng : form.lng,
      locationAccuracy: typeof patch.locationAccuracy === "number" ? patch.locationAccuracy : form.locationAccuracy,
    })
    setApplicationId(saved.id)
    if (!applicationId && saved.documents.length) setDocs(saved.documents)
    return saved.id
  }

  useEffect(() => {
    if (!live) return
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false
      lastSavedRef.current = JSON.stringify(form)
      return
    }
    const payload = JSON.stringify(form)
    if (payload === lastSavedRef.current || savingRef.current) return
    const timer = window.setTimeout(() => {
      savingRef.current = true
      setSaving(true)
      void persistDraft()
        .then(() => {
          lastSavedRef.current = payload
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Could not save draft"))
        .finally(() => {
          savingRef.current = false
          setSaving(false)
        })
    }, 2000)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, live])

  async function openUpload(documentType?: string) {
    setError(null)
    try {
      if (live) await persistDraft()
      setUploadType(documentType)
      setUploadOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not prepare upload")
    }
  }

  function pickFile(documentType: string) {
    void openUpload(documentType)
  }

  async function handleSaveDraft() {
    setError(null)
    setSaving(true)
    try {
      await persistDraft()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save draft")
    } finally {
      setSaving(false)
    }
  }

  async function captureLocation() {
    if (!navigator.geolocation) {
      setError("Location is not available in this browser. Use HTTPS or localhost and allow location access.")
      return
    }
    setError(null)
    setLocating(true)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        })
      })
      const next = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        locationAccuracy: position.coords.accuracy,
        locationCapturedAt: new Date().toISOString(),
      }
      setForm((prev) => ({ ...prev, ...next }))
      if (live) {
        await persistDraft({ ...form, ...next })
      }
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? Number(err.code) : 0
      if (code === 1) setError("Location permission was denied. Allow location access and try again.")
      else if (code === 3) setError("Location capture timed out. Move closer to a window and try again.")
      else setError("Location capture was unavailable. Check that location services are on.")
    } finally {
      setLocating(false)
    }
  }

  async function goNext() {
    setError(null)
    if (!skipWizardGates) {
      if (step === 2 && !step2Valid) {
        const names = missingRequiredDocs.map((doc) => doc.name)
        setError(
          names.length
            ? `Upload the required documents before continuing: ${names.join(", ")}`
            : "Upload the required documents before continuing.",
        )
        const first = missingRequiredDocs[0]?.type
        if (first) {
          document.getElementById(`document-slot-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
        }
        return
      }
      if (step === 3 && !step3Valid) {
        setError("Enter a deposit reference and upload deposit proof before continuing.")
        return
      }
      if (step === 1 && !step1Valid) {
        setError("Complete the required fields and capture GPS before continuing.")
        return
      }
    }
    if (live && step === 1) {
      try {
        await persistDraft()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save draft")
        return
      }
    }
    if (step < steps.length) setStep((s) => s + 1)
  }
  function goBack() {
    if (step > 1) setStep((s) => s - 1)
  }

  async function handleSubmit(fillTestData = false) {
    if (!skipWizardGates && !canSubmit) {
      setError("Complete required fields, documents, GPS, and deposit proof before submitting.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      if (live) {
        const id = await persistDraft()
        if (!id) throw new Error("Missing application")
        if (!skipWizardGates || !fillTestData) {
          await upsertDeposit({ applicationId: id, reference: form.depositReference, status: "SUBMITTED" })
        }
        const result = await submitApplication(id, { fillTestData: skipWizardGates && fillTestData })
        setSubmittedNumber(result.application.appNumber)
      }
      setUsedTestSubmit(fillTestData)
      setSubmitted(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit application")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-3xl bg-card p-10 text-center shadow-sm ring-1 ring-border/60">
        <span className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-7" />
        </span>
        <h2 className="text-xl font-semibold text-foreground">Application submitted</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Thank you, {(form.fullName || agent.fullName).split(" ")[0]}. Your application
          {submittedNumber ? ` ${submittedNumber}` : ""} has been received and is now pending review by our central
          team. You&apos;ll be notified as soon as there&apos;s an update.
        </p>
        {usedTestSubmit ? (
          <p className="max-w-md text-xs text-muted-foreground">
            Local development only. Test submit fills sample data and placeholder files that cannot be previewed. Use
            real uploads for demos.
          </p>
        ) : null}
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
    <div className="flex flex-col gap-8">
      <WizardSteps
        steps={[
          { label: "Personal & Business" },
          { label: `Documents ${docsProgress.uploaded}/${docsProgress.total}` },
          { label: "Deposit Payment" },
          { label: "Review & Submit" },
        ]}
        current={step}
      />

      <div className="rounded-3xl bg-card shadow-sm ring-1 ring-border/60">
        {step === 1 && (
          <div className="flex flex-col gap-10 p-8 md:p-10">
            <section className="flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Channel Declaration</h2>
                <p className="mt-1 text-sm text-muted-foreground">Business, channel, and identity details for this outlet.</p>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="fullName" required>
                    Full name
                  </FieldLabel>
                  <Input id="fullName" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className={controlClass} />
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="phone" required>
                    Phone number
                  </FieldLabel>
                  <Input id="phone" value={formatPhoneTZ(form.phone)} readOnly className={cn(controlClass, "bg-muted")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="channelParentType" required>
                    Channel parent type
                  </FieldLabel>
                  <Select value={CHANNEL_PARENT_TYPE} disabled>
                    <SelectTrigger id="channelParentType" className={cn(controlClass, "w-full bg-muted")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value={CHANNEL_PARENT_TYPE}>{CHANNEL_PARENT_TYPE}</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="channelParentName" required>
                    Channel parent name
                  </FieldLabel>
                  <Input id="channelParentName" value={CHANNEL_PARENT_NAME} readOnly className={cn(controlClass, "bg-muted")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="channelManagerType" required>
                    Channel manager type
                  </FieldLabel>
                  <Select value={form.channelManagerType} onValueChange={(v) => update("channelManagerType", v ?? "")}>
                    <SelectTrigger id="channelManagerType" className={cn(controlClass, "w-full")}>
                      <SelectValue placeholder="Select manager type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {CHANNEL_MANAGER_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="channelManagerName" required>
                    Channel manager name
                  </FieldLabel>
                  <Input id="channelManagerName" value={CHANNEL_MANAGER_NAME} readOnly className={cn(controlClass, "bg-muted")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="channelType" required>
                    Channel tier
                  </FieldLabel>
                  <Select value={CHANNEL_TIER} disabled>
                    <SelectTrigger id="channelType" className={cn(controlClass, "w-full bg-muted")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value={CHANNEL_TIER}>{CHANNEL_TIER}</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="channel" required>
                    Channel
                  </FieldLabel>
                  <Select value={form.channel} onValueChange={(v) => update("channel", v ?? "")}>
                    <SelectTrigger id="channel" className={cn(controlClass, "w-full")}>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {channels.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="businessName" required>
                    Channel name
                  </FieldLabel>
                  <Input id="businessName" value={form.businessName} readOnly className={cn(controlClass, "bg-muted")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="sector" required>
                    Business sector
                  </FieldLabel>
                  <Select value={form.sector} onValueChange={(v) => update("sector", v ?? "")}>
                    <SelectTrigger id="sector" className={cn(controlClass, "w-full")}>
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {sectors.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="tinNumber">TIN number</FieldLabel>
                  <Input id="tinNumber" value={form.tinNumber} onChange={(e) => update("tinNumber", e.target.value)} className={controlClass} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="idType" required>
                    ID type
                  </FieldLabel>
                  <Select value={form.idType} onValueChange={(v) => update("idType", v ?? "")}>
                    <SelectTrigger id="idType" className={cn(controlClass, "w-full")}>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {ID_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="idNumber" required>
                    ID number
                  </FieldLabel>
                  <Input id="idNumber" value={form.idNumber} onChange={(e) => update("idNumber", e.target.value)} className={controlClass} />
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="issuedPlace" required>
                    Issued place
                  </FieldLabel>
                  <Input
                    id="issuedPlace"
                    value={form.issuedPlace}
                    onChange={(e) => update("issuedPlace", e.target.value)}
                    className={controlClass}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="issuedDate" required>
                    Issued date
                  </FieldLabel>
                  <Input
                    id="issuedDate"
                    type="date"
                    value={form.issuedDate}
                    onChange={(e) => update("issuedDate", e.target.value)}
                    className={controlClass}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="expireDate" required>
                    Expiry date
                  </FieldLabel>
                  <Input
                    id="expireDate"
                    type="date"
                    value={form.expireDate}
                    onChange={(e) => update("expireDate", e.target.value)}
                    className={controlClass}
                  />
                  {idExpiryNote ? <p className="text-xs text-destructive">{idExpiryNote}</p> : null}
                </Field>
              </div>
            </section>

            <section className="flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Contact Information</h2>
                <p className="mt-1 text-sm text-muted-foreground">Address and contact details for this application.</p>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="email" required>
                    Email address
                  </FieldLabel>
                  <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={controlClass} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="country" required>
                    Country
                  </FieldLabel>
                  <Input id="country" value={form.country} onChange={(e) => update("country", e.target.value)} className={controlClass} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="province" required>
                    Province / region
                  </FieldLabel>
                  <Input id="province" value={form.province} onChange={(e) => update("province", e.target.value)} className={controlClass} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="district" required>
                    District
                  </FieldLabel>
                  <Input id="district" value={form.district} onChange={(e) => update("district", e.target.value)} className={controlClass} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ward" required>
                    Ward
                  </FieldLabel>
                  <Input id="ward" value={form.ward} onChange={(e) => update("ward", e.target.value)} className={controlClass} />
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="street" required>
                    Street
                  </FieldLabel>
                  <Input id="street" value={form.street} onChange={(e) => update("street", e.target.value)} className={controlClass} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="houseNumber" required>
                    House / plot number
                  </FieldLabel>
                  <Input
                    id="houseNumber"
                    value={form.houseNumber}
                    onChange={(e) => update("houseNumber", e.target.value)}
                    className={controlClass}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="gender" required>
                    Gender
                  </FieldLabel>
                  <Select value={form.gender} onValueChange={(v) => update("gender", v ?? "")}>
                    <SelectTrigger id="gender" className={cn(controlClass, "w-full")}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="flex flex-col gap-3 rounded-3xl bg-secondary/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">GPS coordinates</p>
                  {capturedLocation ? (
                    <>
                      <p className="mt-1 font-mono text-sm text-foreground">{formatGps(form.lat, form.lng)}</p>
                      {form.locationCapturedAt ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Captured {formatDateTime(form.locationCapturedAt)}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">Not captured yet</p>
                  )}
                </div>
                <Button type="button" onClick={() => void captureLocation()} disabled={locating}>
                  {locating ? <Loader2 className="size-4 animate-spin" /> : <Crosshair data-icon="inline-start" />}
                  {locating ? "Capturing..." : "Capture My Location"}
                </Button>
              </div>
            </section>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4 p-8 md:p-10">
            <p className="text-sm text-muted-foreground">
              National ID, TIN, licence, and deposit proof must match the registered name, ID, TIN, and phone. Shop
              photos and the agreement contract are not checked against your current address.
            </p>
            {missingRequiredDocs.length > 0 ? (
              <div className="portal-callout portal-callout-destructive flex-col">
                <p className="font-medium">
                  {missingRequiredDocs.length} required document{missingRequiredDocs.length === 1 ? "" : "s"} still
                  missing. Upload {missingRequiredDocs.length === 1 ? "it" : "them"} to continue.
                </p>
                <ul className="mt-2 flex flex-col gap-1">
                  {missingRequiredDocs.map((doc) => (
                    <li key={doc.type}>
                      <button
                        type="button"
                        className="text-left font-medium underline underline-offset-2"
                        onClick={() =>
                          document
                            .getElementById(`document-slot-${doc.type}`)
                            ?.scrollIntoView({ behavior: "smooth", block: "center" })
                        }
                      >
                        {doc.name}
                        {doc.status === "rejected" ? " — rejected, upload again" : " — not uploaded"}
                      </button>
                    </li>
                  ))}
                </ul>
                {missingRequiredDocs.some((doc) => doc.status === "rejected") ? (
                  <a href="/agent/help#why-rejected" className="mt-2 w-fit text-xs font-semibold underline underline-offset-2">
                    Why was this rejected?
                  </a>
                ) : null}
              </div>
            ) : null}
            <SupportingDocumentsList
              documents={docs}
              applicationId={applicationId}
              live={live}
              framed={false}
              agentName={form.fullName || agent.fullName}
              applicationNumber={application?.appNumber}
              onDocumentsChange={setDocs}
              onApplicationReady={(next) => {
                setApplicationId(next.id)
                if (next.documents.length) setDocs(next.documents)
              }}
              onError={setError}
            />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6 p-8 md:p-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="inline-flex items-center gap-1.5 text-lg font-semibold text-foreground">
                  Deposit Payment
                  <HelpHint articleId="deposit-steps" />
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  A refundable deposit of TZS 100,000 must be made from your registered mobile number.
                </p>
              </div>
              <Wallet className="size-5 shrink-0 text-muted-foreground" />
            </div>

            <div className="flex flex-col justify-between gap-3 rounded-lg bg-secondary/60 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Required amount</p>
                <p className="mt-1 font-mono text-2xl font-medium tabular-nums tracking-tight text-foreground">
                  {formatCurrencyTZS(100000)}
                </p>
              </div>
              <span className="inline-flex w-fit items-center rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                Standard Tier
              </span>
            </div>

            <Field>
              <Label htmlFor="depositReference">Payment / transaction reference</Label>
              <Input
                id="depositReference"
                placeholder="e.g. TXN-88213-MP or MPESA-4A2E19"
                value={form.depositReference}
                onChange={(e) => update("depositReference", e.target.value)}
                className={controlClass}
              />
            </Field>

            <Field>
              <Label>Deposit proof</Label>
              <button
                type="button"
                onClick={() => pickFile("deposit_proof")}
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
                    <span className="text-sm font-medium text-foreground">Deposit proof uploaded</span>
                  </>
                ) : (
                  <>
                    <Upload className="size-6 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Upload deposit screenshot</span>
                    <span className="text-xs text-muted-foreground">JPG, PNG, or PDF. Max 10MB.</span>
                  </>
                )}
              </button>
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-6 p-8 md:p-10">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Review &amp; Submit</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Confirm the formatted details below. Submit is blocked until required fields, documents, and deposit
                proof are complete.
              </p>
            </div>

            {!canSubmit ? (
              <div className="portal-callout portal-callout-destructive flex-col">
                <p className="font-medium">
                  Action required
                  {missingRequiredDocs.length > 0
                    ? `: ${missingRequiredDocs.length} required document${missingRequiredDocs.length === 1 ? "" : "s"} missing — ${missingRequiredDocs.map((doc) => doc.name).join(", ")}`
                    : !step3Valid
                      ? ": deposit reference and proof are required"
                      : !capturedLocation
                        ? ": capture live GPS coordinates"
                        : ": complete the required application fields"}
                </p>
                {missingRequiredDocs.length > 0 ? (
                  <button type="button" className="w-fit text-xs font-semibold tracking-wider uppercase underline" onClick={() => setStep(2)}>
                    Upload now
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="flex flex-col gap-4 lg:col-span-2">
                <ReviewCard title="Personal & Business" onEdit={() => setStep(1)}>
                  <ReviewItem label="Full legal name" value={form.fullName} />
                  <ReviewItem label="Gender" value={form.gender || "—"} />
                  <ReviewItem label="Phone" value={formatPhoneTZ(form.phone)} />
                  <ReviewItem label="Email" value={form.email} />
                  <ReviewItem label="Sector" value={sectors.find((s) => s.id === form.sector)?.name || form.sector || "—"} />
                  <ReviewItem label="Channel name" value={form.businessName || "—"} />
                  <ReviewItem label="ID" value={`${form.idType || "—"} · ${form.idNumber || "—"}`} />
                  <ReviewItem label="Issued" value={`${form.issuedPlace || "—"} · ${formatDateLong(form.issuedDate)}`} />
                  <ReviewItem label="Expiry" value={formatDateLong(form.expireDate)} />
                </ReviewCard>

                <ReviewCard title="Location & Contact" onEdit={() => setStep(1)}>
                  <ReviewItem label="Ward" value={form.ward || "—"} />
                  <ReviewItem
                    label="Address"
                    value={[form.houseNumber, form.street, form.district, form.province, form.country].filter(Boolean).join(", ") || "—"}
                  />
                  <ReviewItem label="Coordinates" value={formatGps(form.lat, form.lng)} />
                </ReviewCard>

                <ReviewCard title="Channel Declaration" onEdit={() => setStep(1)}>
                  <ReviewItem label="Parent type" value={form.channelParentType || "—"} />
                  <ReviewItem label="Parent name" value={form.channelParentName || "—"} />
                  <ReviewItem label="Manager type" value={form.channelManagerType || "—"} />
                  <ReviewItem label="Manager name" value={form.channelManagerName || "—"} />
                  <ReviewItem label="Channel tier" value={form.channelType || "—"} />
                  <ReviewItem label="Channel" value={channels.find((c) => c.id === form.channel)?.name || form.channel || "—"} />
                </ReviewCard>
              </div>

              <div className="portal-table">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h3 className="text-sm font-semibold text-foreground">Documents</h3>
                  <span className="text-xs text-muted-foreground">
                    {uploadedCount}/{requiredCount}
                  </span>
                </div>
                <ul className="divide-y divide-border">
                  {docsProgress.slots.map((doc) => (
                    <li key={doc.type} className="flex items-start justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">{doc.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {isFilledDocumentStatus(doc.status)
                            ? doc.originalName || "Uploaded"
                            : doc.status === "rejected"
                              ? "Rejected"
                              : doc.required === false
                                ? "Optional"
                                : "Required"}
                        </p>
                      </div>
                      {isFilledDocumentStatus(doc.status) ? (
                        <CheckCircle2 className="size-4 shrink-0 text-success" />
                      ) : (
                        <button
                          type="button"
                          className="text-[10px] font-semibold tracking-wider text-destructive uppercase"
                          onClick={() => setStep(2)}
                        >
                          {doc.required === false ? "Add" : "Required"}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="border-t border-border px-4 py-3">
                  <ReviewItem label="Deposit" value={`${formatCurrencyTZS(100000)} · ${form.depositReference || "No reference"}`} />
                </div>
              </div>
            </div>

            <Field>
              <Label htmlFor="notes">Additional notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Anything else the review team should know?"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </Field>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="lg" onClick={goBack} disabled={step === 1}>
              <ArrowLeft data-icon="inline-start" />
              Back
            </Button>
            <Button variant="ghost" size="lg" onClick={() => void handleSaveDraft()} disabled={saving || !live}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save Draft
            </Button>
          </div>

          {step < steps.length ? (
            <Button
              size="lg"
              onClick={() => void goNext()}
              disabled={
                skipWizardGates
                  ? false
                  : (step === 1 && !step1Valid) || (step === 2 && !step2Valid) || (step === 3 && !step3Valid)
              }
            >
              {step === 2 ? "Next: Payment" : `Next: ${steps[step].label}`}
              <ArrowRight data-icon="inline-end" />
            </Button>
          ) : (
            <div className="flex flex-wrap justify-end gap-2">
              {skipWizardGates ? (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => void handleSubmit(true)}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  Submit test application
                </Button>
              ) : null}
              <Button
                size="lg"
                onClick={() => void handleSubmit(false)}
                disabled={submitting || (!skipWizardGates && !canSubmit)}
              >
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
            </div>
          )}
        </div>
        <p className="text-center text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {saving && "Saving draft..."}
          {!saving &&
            skipWizardGates &&
            (step === 4
              ? "Development: test submit fills placeholders with no files. Use Submit Application with real uploads for demos."
              : "Development: you can continue without completing this step")}
          {!saving && !skipWizardGates && step === 1 && !step1Valid && "Complete the required fields to continue"}
          {!saving &&
            !skipWizardGates &&
            step === 2 &&
            !step2Valid &&
            `Missing: ${missingRequiredDocs.map((doc) => doc.name).join(", ") || "required documents"}`}
          {!saving && !skipWizardGates && step === 2 && step2Valid && "Supporting documents complete"}
          {!saving &&
            !skipWizardGates &&
            step === 3 &&
            !step3Valid &&
            "Enter your transaction reference and upload proof to continue"}
          {!saving && !skipWizardGates && step === 4 && !canSubmit && "Resolve the items above before submitting"}
          {!saving && !skipWizardGates && step === 4 && canSubmit && "Ready to submit"}
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        applicationId={applicationId}
        documents={docs}
        initialType={uploadType}
        live={live}
        onApplicationReady={(next) => {
          setApplicationId(next.id)
          if (next.documents.length) setDocs(next.documents)
        }}
        onComplete={(next, verification) => {
          setDocs(next)
          if (verification && !verification.passed) {
            setError(`Uploaded, but flagged for review: ${verification.issues.join(". ")}`)
          }
        }}
      />
    </div>
  )
}

function ReviewCard({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <section className="rounded-3xl ring-1 ring-border/60">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          <Pencil data-icon="inline-start" />
          Edit
        </Button>
      </header>
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl ring-1 ring-border/60 p-3">
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  )
}
