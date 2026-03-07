import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Instagram, Github, Youtube, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendContact } from "@/lib/api";

export function ContactSection() {
  const { toast } = useToast();
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
    <section id="contacto" className="py-20 md:py-28 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Contacto</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            ¿Interesado en colaborar? Escríbenos
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5 bg-card rounded-xl border border-border p-6 md:p-8">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="c-name">Nombre</Label>
                <Input id="c-name" placeholder="Tu nombre" value={form.name} onChange={(e) => update("name", e.target.value)} />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-email">Email</Label>
                <Input id="c-email" type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-inst">Institución</Label>
              <Input id="c-inst" placeholder="Nombre de tu institución" value={form.institution} onChange={(e) => update("institution", e.target.value)} />
              {errors.institution && <p className="text-xs text-destructive">{errors.institution}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-msg">Mensaje</Label>
              <Textarea id="c-msg" placeholder="Cuéntanos sobre tu interés en el proyecto..." rows={5} value={form.message} onChange={(e) => update("message", e.target.value)} />
              {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
            </div>
            <Button type="submit" disabled={sending} className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 font-semibold gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Enviando..." : "Enviar Mensaje"}
            </Button>
          </form>

          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-5">
              <h3 className="font-bold text-foreground text-lg">Información de Contacto</h3>
               {[
                 { icon: Mail, label: "Equipo M.A.N.G.O", href: "https://mail.google.com/mail/?view=cm&to=mango.monitoring@integramosoe.com&su=Contacto%20-%20Proyecto%20M.A.N.G.O" },
                 { icon: Phone, label: "+57 321 7693339", phone: "+573217693339" },
                 { icon: MapPin, label: "Cali, Valle del Cauca, Colombia", href: "https://www.google.com/maps/place/Cali,+Valle+del+Cauca,+Colombia" },
               ].map((item, i) => (
                 item.phone ? (
                   <button key={i} onClick={() => handlePhoneCopy(item.phone)} className="flex items-center gap-3 group w-full text-left">
                     <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary group-hover:bg-secondary/20 transition-colors">
                       <item.icon className="h-5 w-5" />
                     </div>
                     <span className="text-muted-foreground text-sm group-hover:text-foreground transition-colors underline-offset-2 group-hover:underline cursor-pointer">{item.label}</span>
                   </button>
                 ) : (
                   <a key={i} href={item.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                     <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary group-hover:bg-secondary/20 transition-colors">
                       <item.icon className="h-5 w-5" />
                     </div>
                     <span className="text-muted-foreground text-sm group-hover:text-foreground transition-colors underline-offset-2 group-hover:underline">{item.label}</span>
                   </a>
                 )
               ))}
            </div>

            <div>
              <h3 className="font-bold text-foreground text-lg mb-4">Síguenos</h3>
              <div className="flex gap-3">
                {[
                   { icon: Instagram, href: "https://www.instagram.com/32_t4t4n?igsh=MXhhdGpseDM0MjJheg==" },
                   { icon: Github, href: "https://github.com/T4t4n32/M_A_N_G_O.git" },
                   { icon: Youtube, href: "https://youtube.com/playlist?list=PLihEHjHiZwltNIlYLmrEdUG3jRNTNPq0M&si=4u1WoJxnbaPwi2dX" },
                ].map((s, i) => (
                  <a
                    key={i}
                    href={s.href}
                    className="p-3 rounded-xl bg-card border border-border text-muted-foreground hover:text-secondary hover:border-secondary/30 transition-all"
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
