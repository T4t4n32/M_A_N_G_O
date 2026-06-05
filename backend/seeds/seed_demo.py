"""
seed_demo.py — Populates the database with:
  1. All 70 demo users from mango_usuarios_planes_demo.xlsx
  2. One super-admin account for the Panel Emma console
  3. Initial editable content keys

Run once after creating the database:
    cd backend
    source venv/bin/activate
    python seeds/seed_demo.py

IMPORTANT — CHANGE_BEFORE_PRODUCTION:
  - Replace SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD below
    with your real credentials before the first production deploy.
  - Rotate all MNGO-* demo passwords or delete demo users entirely.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import create_app
from app.extensions import db
from app.models.content import EditableContent, DEFAULT_CONTENT

# NOTE: This seed script targets a legacy User schema. If the DB is already
# running MangoUser (current schema), rewrite seed_users() to use MangoUser.

# ============================================================
# CHANGE_BEFORE_PRODUCTION: Set real super-admin credentials.
# Never leave these defaults in production.
# ============================================================
SUPER_ADMIN_EMAIL = "CHANGE_THIS@yourdomain.com"
SUPER_ADMIN_PASSWORD = "CHANGE_THIS_STRONG_PASSWORD"
SUPER_ADMIN_FULL_NAME = "Administrador M.A.N.G.O."
# ============================================================

DEMO_USERS = [
    # --- Plan: Publico | role: visitante ---
    {"demo_id": 1001, "full_name": "Sebastian Sanchez Ruiz", "username": "ssanchez1001", "password": "MNGO-PUBL-1001", "email": "ssanchez1001@demo.mango.local", "plan": "Publico", "role": "visitante"},
    {"demo_id": 1002, "full_name": "Valentina Martinez Mejia", "username": "vmartinez1002", "password": "MNGO-PUBL-1002", "email": "vmartinez1002@demo.mango.local", "plan": "Publico", "role": "visitante"},
    {"demo_id": 1003, "full_name": "Santiago Diaz Arango", "username": "sdiaz1003", "password": "MNGO-PUBL-1003", "email": "sdiaz1003@demo.mango.local", "plan": "Publico", "role": "visitante"},
    {"demo_id": 1004, "full_name": "Isabella Vargas Quintero", "username": "ivargas1004", "password": "MNGO-PUBL-1004", "email": "ivargas1004@demo.mango.local", "plan": "Publico", "role": "visitante"},
    {"demo_id": 1005, "full_name": "Mateo Rojas Ruiz", "username": "mrojas1005", "password": "MNGO-PUBL-1005", "email": "mrojas1005@demo.mango.local", "plan": "Publico", "role": "visitante"},
    {"demo_id": 1006, "full_name": "Camila Navarro Mejia", "username": "cnavarro1006", "password": "MNGO-PUBL-1006", "email": "cnavarro1006@demo.mango.local", "plan": "Publico", "role": "visitante"},
    {"demo_id": 1007, "full_name": "Nicolas Pineda Arango", "username": "npineda1007", "password": "MNGO-PUBL-1007", "email": "npineda1007@demo.mango.local", "plan": "Publico", "role": "visitante"},
    {"demo_id": 1008, "full_name": "Mariana Gomez Quintero", "username": "mgomez1008", "password": "MNGO-PUBL-1008", "email": "mgomez1008@demo.mango.local", "plan": "Publico", "role": "visitante"},
    # --- Plan: Registrado Basico | role: usuario_basico ---
    {"demo_id": 1009, "full_name": "Juan Lopez Ruiz", "username": "jlopez1009", "password": "MNGO-REGI-1009", "email": "jlopez1009@demo.mango.local", "plan": "Registrado Basico", "role": "usuario_basico"},
    {"demo_id": 1010, "full_name": "Gabriela Torres Mejia", "username": "gtorres1010", "password": "MNGO-REGI-1010", "email": "gtorres1010@demo.mango.local", "plan": "Registrado Basico", "role": "usuario_basico"},
    {"demo_id": 1011, "full_name": "Daniel Castro Arango", "username": "dcastro1011", "password": "MNGO-REGI-1011", "email": "dcastro1011@demo.mango.local", "plan": "Registrado Basico", "role": "usuario_basico"},
    {"demo_id": 1012, "full_name": "Sofia Suarez Quintero", "username": "ssuarez1012", "password": "MNGO-REGI-1012", "email": "ssuarez1012@demo.mango.local", "plan": "Registrado Basico", "role": "usuario_basico"},
    {"demo_id": 1013, "full_name": "Samuel Mendoza Ruiz", "username": "smendoza1013", "password": "MNGO-REGI-1013", "email": "smendoza1013@demo.mango.local", "plan": "Registrado Basico", "role": "usuario_basico"},
    {"demo_id": 1014, "full_name": "Luciana Velez Mejia", "username": "lvelez1014", "password": "MNGO-REGI-1014", "email": "lvelez1014@demo.mango.local", "plan": "Registrado Basico", "role": "usuario_basico"},
    {"demo_id": 1015, "full_name": "David Rodriguez Arango", "username": "drodriguez1015", "password": "MNGO-REGI-1015", "email": "drodriguez1015@demo.mango.local", "plan": "Registrado Basico", "role": "usuario_basico"},
    {"demo_id": 1016, "full_name": "Emma Hernandez Quintero", "username": "ehernandez1016", "password": "MNGO-REGI-1016", "email": "ehernandez1016@demo.mango.local", "plan": "Registrado Basico", "role": "usuario_basico"},
    {"demo_id": 1017, "full_name": "Andres Ramirez Ruiz", "username": "aramirez1017", "password": "MNGO-REGI-1017", "email": "aramirez1017@demo.mango.local", "plan": "Registrado Basico", "role": "usuario_basico"},
    {"demo_id": 1018, "full_name": "Juliana Moreno Mejia", "username": "jmoreno1018", "password": "MNGO-REGI-1018", "email": "jmoreno1018@demo.mango.local", "plan": "Registrado Basico", "role": "usuario_basico"},
    # --- Plan: Documental Premium | role: documental_premium ---
    {"demo_id": 1019, "full_name": "Felipe Ortiz Arango", "username": "fortiz1019", "password": "MNGO-DOCU-1019", "email": "fortiz1019@demo.mango.local", "plan": "Documental Premium", "role": "documental_premium"},
    {"demo_id": 1020, "full_name": "Antonella Guerrero Quintero", "username": "aguerrero1020", "password": "MNGO-DOCU-1020", "email": "aguerrero1020@demo.mango.local", "plan": "Documental Premium", "role": "documental_premium"},
    {"demo_id": 1021, "full_name": "Miguel Sanchez Ruiz", "username": "msanchez1021", "password": "MNGO-DOCU-1021", "email": "msanchez1021@demo.mango.local", "plan": "Documental Premium", "role": "documental_premium"},
    {"demo_id": 1022, "full_name": "Paula Martinez Mejia", "username": "pmartinez1022", "password": "MNGO-DOCU-1022", "email": "pmartinez1022@demo.mango.local", "plan": "Documental Premium", "role": "documental_premium"},
    {"demo_id": 1023, "full_name": "Alejandro Diaz Arango", "username": "adiaz1023", "password": "MNGO-DOCU-1023", "email": "adiaz1023@demo.mango.local", "plan": "Documental Premium", "role": "documental_premium"},
    {"demo_id": 1024, "full_name": "Sara Vargas Quintero", "username": "svargas1024", "password": "MNGO-DOCU-1024", "email": "svargas1024@demo.mango.local", "plan": "Documental Premium", "role": "documental_premium"},
    {"demo_id": 1025, "full_name": "Tomas Rojas Ruiz", "username": "trojas1025", "password": "MNGO-DOCU-1025", "email": "trojas1025@demo.mango.local", "plan": "Documental Premium", "role": "documental_premium"},
    {"demo_id": 1026, "full_name": "Manuela Navarro Mejia", "username": "mnavarro1026", "password": "MNGO-DOCU-1026", "email": "mnavarro1026@demo.mango.local", "plan": "Documental Premium", "role": "documental_premium"},
    {"demo_id": 1027, "full_name": "Joaquin Pineda Arango", "username": "jpineda1027", "password": "MNGO-DOCU-1027", "email": "jpineda1027@demo.mango.local", "plan": "Documental Premium", "role": "documental_premium"},
    {"demo_id": 1028, "full_name": "Valeria Gomez Quintero", "username": "vgomez1028", "password": "MNGO-DOCU-1028", "email": "vgomez1028@demo.mango.local", "plan": "Documental Premium", "role": "documental_premium"},
    {"demo_id": 1029, "full_name": "Martin Lopez Ruiz", "username": "mlopez1029", "password": "MNGO-DOCU-1029", "email": "mlopez1029@demo.mango.local", "plan": "Documental Premium", "role": "documental_premium"},
    {"demo_id": 1030, "full_name": "Natalia Torres Mejia", "username": "ntorres1030", "password": "MNGO-DOCU-1030", "email": "ntorres1030@demo.mango.local", "plan": "Documental Premium", "role": "documental_premium"},
    # --- Plan: DataLine Low | role: dataline_low ---
    {"demo_id": 1031, "full_name": "Esteban Castro Arango", "username": "ecastro1031", "password": "MNGO-DATA-1031", "email": "ecastro1031@demo.mango.local", "plan": "DataLine Low", "role": "dataline_low"},
    {"demo_id": 1032, "full_name": "Laura Suarez Quintero", "username": "lsuarez1032", "password": "MNGO-DATA-1032", "email": "lsuarez1032@demo.mango.local", "plan": "DataLine Low", "role": "dataline_low"},
    {"demo_id": 1033, "full_name": "Cristian Mendoza Ruiz", "username": "cmendoza1033", "password": "MNGO-DATA-1033", "email": "cmendoza1033@demo.mango.local", "plan": "DataLine Low", "role": "dataline_low"},
    {"demo_id": 1034, "full_name": "Salome Velez Mejia", "username": "svelez1034", "password": "MNGO-DATA-1034", "email": "svelez1034@demo.mango.local", "plan": "DataLine Low", "role": "dataline_low"},
    {"demo_id": 1035, "full_name": "Kevin Rodriguez Arango", "username": "krodriguez1035", "password": "MNGO-DATA-1035", "email": "krodriguez1035@demo.mango.local", "plan": "DataLine Low", "role": "dataline_low"},
    {"demo_id": 1036, "full_name": "Maria Hernandez Quintero", "username": "mhernandez1036", "password": "MNGO-DATA-1036", "email": "mhernandez1036@demo.mango.local", "plan": "DataLine Low", "role": "dataline_low"},
    {"demo_id": 1037, "full_name": "Jose Ramirez Ruiz", "username": "jramirez1037", "password": "MNGO-DATA-1037", "email": "jramirez1037@demo.mango.local", "plan": "DataLine Low", "role": "dataline_low"},
    {"demo_id": 1038, "full_name": "Ana Moreno Mejia", "username": "amoreno1038", "password": "MNGO-DATA-1038", "email": "amoreno1038@demo.mango.local", "plan": "DataLine Low", "role": "dataline_low"},
    {"demo_id": 1039, "full_name": "Julian Ortiz Arango", "username": "jortiz1039", "password": "MNGO-DATA-1039", "email": "jortiz1039@demo.mango.local", "plan": "DataLine Low", "role": "dataline_low"},
    {"demo_id": 1040, "full_name": "Elena Guerrero Quintero", "username": "eguerrero1040", "password": "MNGO-DATA-1040", "email": "eguerrero1040@demo.mango.local", "plan": "DataLine Low", "role": "dataline_low"},
    {"demo_id": 1041, "full_name": "Carlos Sanchez Ruiz", "username": "csanchez1041", "password": "MNGO-DATA-1041", "email": "csanchez1041@demo.mango.local", "plan": "DataLine Low", "role": "dataline_low"},
    {"demo_id": 1042, "full_name": "Daniela Martinez Mejia", "username": "dmartinez1042", "password": "MNGO-DATA-1042", "email": "dmartinez1042@demo.mango.local", "plan": "DataLine Low", "role": "dataline_low"},
    # --- Plan: DataLine High | role: dataline_high ---
    {"demo_id": 1043, "full_name": "Sebas Diaz Arango", "username": "sdiaz1043", "password": "MNGO-DATA-1043", "email": "sdiaz1043@demo.mango.local", "plan": "DataLine High", "role": "dataline_high"},
    {"demo_id": 1044, "full_name": "Alejandra Vargas Quintero", "username": "avargas1044", "password": "MNGO-DATA-1044", "email": "avargas1044@demo.mango.local", "plan": "DataLine High", "role": "dataline_high"},
    {"demo_id": 1045, "full_name": "Sebastian Rojas Ruiz", "username": "srojas1045", "password": "MNGO-DATA-1045", "email": "srojas1045@demo.mango.local", "plan": "DataLine High", "role": "dataline_high"},
    {"demo_id": 1046, "full_name": "Luisa Navarro Mejia", "username": "lnavarro1046", "password": "MNGO-DATA-1046", "email": "lnavarro1046@demo.mango.local", "plan": "DataLine High", "role": "dataline_high"},
    {"demo_id": 1047, "full_name": "Diego Pineda Arango", "username": "dpineda1047", "password": "MNGO-DATA-1047", "email": "dpineda1047@demo.mango.local", "plan": "DataLine High", "role": "dataline_high"},
    {"demo_id": 1048, "full_name": "Renata Gomez Quintero", "username": "rgomez1048", "password": "MNGO-DATA-1048", "email": "rgomez1048@demo.mango.local", "plan": "DataLine High", "role": "dataline_high"},
    {"demo_id": 1049, "full_name": "Bryan Lopez Ruiz", "username": "blopez1049", "password": "MNGO-DATA-1049", "email": "blopez1049@demo.mango.local", "plan": "DataLine High", "role": "dataline_high"},
    {"demo_id": 1050, "full_name": "Martina Torres Mejia", "username": "mtorres1050", "password": "MNGO-DATA-1050", "email": "mtorres1050@demo.mango.local", "plan": "DataLine High", "role": "dataline_high"},
    {"demo_id": 1051, "full_name": "Sebastian Castro Arango", "username": "scastro1051", "password": "MNGO-DATA-1051", "email": "scastro1051@demo.mango.local", "plan": "DataLine High", "role": "dataline_high"},
    {"demo_id": 1052, "full_name": "Valentina Suarez Quintero", "username": "vsuarez1052", "password": "MNGO-DATA-1052", "email": "vsuarez1052@demo.mango.local", "plan": "DataLine High", "role": "dataline_high"},
    {"demo_id": 1053, "full_name": "Santiago Mendoza Ruiz", "username": "smendoza1053", "password": "MNGO-DATA-1053", "email": "smendoza1053@demo.mango.local", "plan": "DataLine High", "role": "dataline_high"},
    {"demo_id": 1054, "full_name": "Isabella Velez Mejia", "username": "ivelez1054", "password": "MNGO-DATA-1054", "email": "ivelez1054@demo.mango.local", "plan": "DataLine High", "role": "dataline_high"},
    # --- Plan: Institucional/Empresarial | role: institucional ---
    {"demo_id": 1055, "full_name": "Mateo Rodriguez Arango", "username": "mrodriguez1055", "password": "MNGO-INST-1055", "email": "mrodriguez1055@demo.mango.local", "plan": "Institucional/Empresarial", "role": "institucional"},
    {"demo_id": 1056, "full_name": "Camila Hernandez Quintero", "username": "chernandez1056", "password": "MNGO-INST-1056", "email": "chernandez1056@demo.mango.local", "plan": "Institucional/Empresarial", "role": "institucional"},
    {"demo_id": 1057, "full_name": "Nicolas Ramirez Ruiz", "username": "nramirez1057", "password": "MNGO-INST-1057", "email": "nramirez1057@demo.mango.local", "plan": "Institucional/Empresarial", "role": "institucional"},
    {"demo_id": 1058, "full_name": "Mariana Moreno Mejia", "username": "mmoreno1058", "password": "MNGO-INST-1058", "email": "mmoreno1058@demo.mango.local", "plan": "Institucional/Empresarial", "role": "institucional"},
    {"demo_id": 1059, "full_name": "Juan Ortiz Arango", "username": "jortiz1059", "password": "MNGO-INST-1059", "email": "jortiz1059@demo.mango.local", "plan": "Institucional/Empresarial", "role": "institucional"},
    {"demo_id": 1060, "full_name": "Gabriela Guerrero Quintero", "username": "gguerrero1060", "password": "MNGO-INST-1060", "email": "gguerrero1060@demo.mango.local", "plan": "Institucional/Empresarial", "role": "institucional"},
    {"demo_id": 1061, "full_name": "Daniel Sanchez Ruiz", "username": "dsanchez1061", "password": "MNGO-INST-1061", "email": "dsanchez1061@demo.mango.local", "plan": "Institucional/Empresarial", "role": "institucional"},
    {"demo_id": 1062, "full_name": "Sofia Martinez Mejia", "username": "smartinez1062", "password": "MNGO-INST-1062", "email": "smartinez1062@demo.mango.local", "plan": "Institucional/Empresarial", "role": "institucional"},
    {"demo_id": 1063, "full_name": "Samuel Diaz Arango", "username": "sdiaz1063", "password": "MNGO-INST-1063", "email": "sdiaz1063@demo.mango.local", "plan": "Institucional/Empresarial", "role": "institucional"},
    {"demo_id": 1064, "full_name": "Luciana Vargas Quintero", "username": "lvargas1064", "password": "MNGO-INST-1064", "email": "lvargas1064@demo.mango.local", "plan": "Institucional/Empresarial", "role": "institucional"},
    # --- Plan: Administrativo Interno | role: admin ---
    {"demo_id": 1065, "full_name": "David Rojas Ruiz", "username": "drojas1065", "password": "MNGO-ADMI-1065", "email": "drojas1065@demo.mango.local", "plan": "Administrativo Interno", "role": "admin"},
    {"demo_id": 1066, "full_name": "Emma Navarro Mejia", "username": "enavarro1066", "password": "MNGO-ADMI-1066", "email": "enavarro1066@demo.mango.local", "plan": "Administrativo Interno", "role": "admin"},
    {"demo_id": 1067, "full_name": "Andres Pineda Arango", "username": "apineda1067", "password": "MNGO-ADMI-1067", "email": "apineda1067@demo.mango.local", "plan": "Administrativo Interno", "role": "admin"},
    {"demo_id": 1068, "full_name": "Juliana Gomez Quintero", "username": "jgomez1068", "password": "MNGO-ADMI-1068", "email": "jgomez1068@demo.mango.local", "plan": "Administrativo Interno", "role": "admin"},
    {"demo_id": 1069, "full_name": "Felipe Lopez Ruiz", "username": "flopez1069", "password": "MNGO-ADMI-1069", "email": "flopez1069@demo.mango.local", "plan": "Administrativo Interno", "role": "admin"},
    {"demo_id": 1070, "full_name": "Antonella Torres Mejia", "username": "atorres1070", "password": "MNGO-ADMI-1070", "email": "atorres1070@demo.mango.local", "plan": "Administrativo Interno", "role": "admin"},
]


def seed_users(app):
    with app.app_context():
        # ---- Super-admin (Panel Emma) ----
        # CHANGE_BEFORE_PRODUCTION: Replace email and password above.
        existing_admin = User.query.filter_by(email=SUPER_ADMIN_EMAIL).first()
        if not existing_admin:
            admin = User(
                username="super_admin",
                email=SUPER_ADMIN_EMAIL,
                password_hash=bcrypt.generate_password_hash(SUPER_ADMIN_PASSWORD).decode("utf-8"),
                full_name=SUPER_ADMIN_FULL_NAME,
                role="admin",
                plan="Administrativo Interno",
                status="Activo",
            )
            db.session.add(admin)
            print(f"  [+] Super-admin created: {SUPER_ADMIN_EMAIL}")
        else:
            print(f"  [=] Super-admin already exists: {SUPER_ADMIN_EMAIL}")

        # ---- Demo users ----
        created = 0
        skipped = 0
        for u in DEMO_USERS:
            exists = User.query.filter_by(email=u["email"]).first()
            if exists:
                skipped += 1
                continue
            # CHANGE_BEFORE_PRODUCTION: Rotate or delete these demo passwords.
            user = User(
                demo_id=u["demo_id"],
                username=u["username"],
                email=u["email"],
                password_hash=bcrypt.generate_password_hash(u["password"]).decode("utf-8"),
                full_name=u["full_name"],
                role=u["role"],
                plan=u["plan"],
                status="Activo",
            )
            db.session.add(user)
            created += 1

        db.session.commit()
        print(f"  [+] Demo users created: {created} | skipped (already exist): {skipped}")


def seed_content(app):
    with app.app_context():
        created = 0
        for key, value in DEFAULT_CONTENT.items():
            exists = EditableContent.query.get(key)
            if not exists:
                db.session.add(EditableContent(key=key, value=value))
                created += 1
        db.session.commit()
        print(f"  [+] Editable content keys created: {created}")


if __name__ == "__main__":
    app = create_app()
    print("Seeding database...")
    seed_users(app)
    seed_content(app)
    print("Done.")
