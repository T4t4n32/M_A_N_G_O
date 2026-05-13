import DecryptedText from "@/components/effects/DecryptedText";
import GradientText from "@/components/effects/GradientText";
import BorderGlow from "@/components/effects/BorderGlow";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Instagram, Github, Youtube, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendContact } from "@/lib/api";
import { useSiteValue } from "@/lib/siteContent";
import { SiteMediaVisual } from "@/components/SiteMediaVisual";

export function ContactSection() {
  const { toast } = useToast();
  const heading = useSiteValue("contact.heading", "Contacto");
  const subheading = useSiteValue("contact.subheading", "¿Estás interesado en aprender más? Escríbenos");
  const infoTitle = useSiteValue("contact.info.title", "Información de Contacto");
  const socialTitle = useSiteValue("contact.social.title", "Síguenos");
  const [form, setForm] = useState({ name: "", email: "", institution: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Requerido";
    if (form.name.length > 100) e.name = "Máximo 100 caracteres";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email inválido";
    if (form.email.length > 255) e.email = "Máximo 255 caracteres";
    if (!form.institution.trim()) e.institution = "Requerido";
    if (form.institution.length > 150) e.institution = "Máximo 150 caracteres";
    if (!form.message.trim()) e.message = "Requerido";
    if (form.message.length > 2000) e.message = "Máximo 2000 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setSending(true);
    try {
      await sendContact({
        name: form.name.trim(),
        email: form.email.trim(),
        institution: form.institution.trim(),
        message: form.message.trim(),
      });
      toast({ title: "Mensaje enviado", description: "Nos pondremos en contacto pronto." });
      setForm({ name: "", email: "", institution: "", message: "" });
    } catch {
      toast({
        title: "Error al enviar",
        description: "No se pudo enviar el mensaje. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handlePhoneCopy = (phone: string) => {
    navigator.clipboard.writeText(phone);
    toast({ title: "Número copiado", description: "El número ha sido copiado al portapapeles." });
  };

  return (
    <section id="contacto" className="py-20 md:py-28 bg-mango-dark relative overflow-hidden">
      {/* Lightweight CSS gradient instead of WebGL */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_70%,hsl(168_72%_42%/0.06),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,hsl(204_70%_53%/0.05),transparent_50%)] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-3">
            <DecryptedText
              text={heading}
              speed={40}
              maxIterations={8}
              animateOn="view"
              className="text-white"
              encryptedClassName="text-[hsl(168,72%,42%)]/50"
            />
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-lg">
            <GradientText
              colors={['#94a3b8', '#00c9a7', '#38bdf8', '#94a3b8']}
              animationSpeed={12}
              className="text-lg"
            >
              {subheading}
            </GradientText>
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          <BorderGlow
            borderRadius={16}
            glowRadius={20}
            glowIntensity={0.5}
            colors={['#00c9a7', '#38bdf8', '#c084fc']}
            className="lg:col-span-3"
          >
            <form onSubmit={handleSubmit} className="space-y-5 p-6 md:p-8">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="c-name" className="text-white/70">Nombre</Label>
                  <Input id="c-name" required aria-required="true" aria-invalid={!!errors.name} aria-describedby={errors.name ? "err-name" : undefined} placeholder="Tu nombre" value={form.name} onChange={(e) => update("name", e.target.value)} className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/45 focus-visible:ring-2 focus-visible:ring-[hsl(168,72%,42%)]/60" />
                  {errors.name && <p id="err-name" role="alert" className="text-xs text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-email" className="text-white/70">Email</Label>
                  <Input id="c-email" type="email" required aria-required="true" aria-invalid={!!errors.email} aria-describedby={errors.email ? "err-email" : undefined} placeholder="correo@ejemplo.com" value={form.email} onChange={(e) => update("email", e.target.value)} className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/45 focus-visible:ring-2 focus-visible:ring-[hsl(168,72%,42%)]/60" />
                  {errors.email && <p id="err-email" role="alert" className="text-xs text-destructive">{errors.email}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-inst" className="text-white/70">Institución</Label>
                <Input id="c-inst" required aria-required="true" aria-invalid={!!errors.institution} aria-describedby={errors.institution ? "err-inst" : undefined} placeholder="Nombre de tu institución" value={form.institution} onChange={(e) => update("institution", e.target.value)} className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/45 focus-visible:ring-2 focus-visible:ring-[hsl(168,72%,42%)]/60" />
                {errors.institution && <p id="err-inst" role="alert" className="text-xs text-destructive">{errors.institution}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-msg" className="text-white/70">Mensaje</Label>
                <Textarea id="c-msg" required aria-required="true" aria-invalid={!!errors.message} aria-describedby={errors.message ? "err-msg" : undefined} placeholder="Cuéntanos sobre tu interés en el proyecto..." rows={5} value={form.message} onChange={(e) => update("message", e.target.value)} className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/45 focus-visible:ring-2 focus-visible:ring-[hsl(168,72%,42%)]/60" />
                {errors.message && <p id="err-msg" role="alert" className="text-xs text-destructive">{errors.message}</p>}
              </div>
              <Button
                type="submit"
                disabled={sending}
                className="bg-gradient-to-r from-[hsl(168,72%,42%)] to-[hsl(204,70%,53%)] hover:from-[hsl(168,72%,38%)] hover:to-[hsl(204,70%,48%)] text-white rounded-full px-8 font-semibold gap-2 shadow-[0_0_20px_hsl(168_72%_42%/0.25)] hover:shadow-[0_0_35px_hsl(168_72%_42%/0.4)] transition-all duration-300"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? "Enviando..." : "Enviar Mensaje"}
              </Button>
            </form>
          </BorderGlow>

          <div className="lg:col-span-2 space-y-8">
            <SiteMediaVisual
              fieldKey="contact.illustration"
              ariaLabel="Ilustración de contacto"
            />
            <div className="space-y-5">
              <h3 className="font-bold text-white text-lg">{infoTitle}</h3>
              {[
                { icon: Mail, label: "Equipo M.A.N.G.O", href: "https://mail.google.com/mail/?view=cm&to=mango.monitoring@integramosoe.com&su=Contacto%20-%20Proyecto%20M.A.N.G.O" },
                { icon: Phone, label: "+57 321 7693339", phone: "+573217693339" },
                { icon: MapPin, label: "Cali, Valle del Cauca, Colombia", href: "https://www.google.com/maps/place/Cali,+Valle+del+Cauca,+Colombia" },
              ].map((item, i) => (
                item.phone ? (
                  <button key={i} onClick={() => handlePhoneCopy(item.phone)} className="flex items-center gap-3 group w-full text-left">
                    <div className="p-2.5 rounded-xl bg-white/[0.06] text-[hsl(168,72%,42%)] group-hover:bg-white/[0.1] group-hover:shadow-[0_0_12px_hsl(168_72%_42%/0.15)] transition-all duration-300">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-white/50 text-sm group-hover:text-white/80 transition-colors underline-offset-2 group-hover:underline cursor-pointer">{item.label}</span>
                  </button>
                ) : (
                  <a key={i} href={item.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                    <div className="p-2.5 rounded-xl bg-white/[0.06] text-[hsl(168,72%,42%)] group-hover:bg-white/[0.1] group-hover:shadow-[0_0_12px_hsl(168_72%_42%/0.15)] transition-all duration-300">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-white/50 text-sm group-hover:text-white/80 transition-colors underline-offset-2 group-hover:underline">{item.label}</span>
                  </a>
                )
              ))}
            </div>

            <div>
              <h3 className="font-bold text-white text-lg mb-4">{socialTitle}</h3>
              <div className="flex gap-3">
                {[
                  { icon: Instagram, href: "https://www.instagram.com/32_t4t4n?igsh=MXhhdGpseDM0MjJheg==" },
                  { icon: Github, href: "https://github.com/T4t4n32/M_A_N_G_O.git" },
                  { icon: Youtube, href: "https://youtube.com/playlist?list=PLihEHjHiZwltNIlYLmrEdUG3jRNTNPq0M&si=4u1WoJxnbaPwi2dX" },
                ].map((s, i) => (
                  <a
                    key={i}
                    href={s.href}
                    className="p-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/40 hover:text-[hsl(168,72%,42%)] hover:border-[hsl(168,72%,42%)]/30 hover:shadow-[0_0_15px_hsl(168_72%_42%/0.15)] transition-all duration-300"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Social"
                  >
                    <s.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
