import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Company } from "@/models/Company";
import { User } from "@/models/User";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

// GET /api/admin/companies - Lister les compagnies créées par le Super Admin
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Accès réservé exclusivement aux Super Admins Kaweru." },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const companies = await Company.find().sort({ createdAt: -1 });

    // Récupérer le responsable (COMPANY_ADMIN) pour chaque compagnie
    const companiesWithAdmins = await Promise.all(
      companies.map(async (comp) => {
        const adminUser = await User.findOne({
          companyId: comp._id,
          role: "COMPANY_ADMIN",
        }).select("fullName phone email isActive");

        return {
          ...comp.toObject(),
          adminUser: adminUser || null,
        };
      })
    );

    return NextResponse.json({ success: true, data: companiesWithAdmins });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/admin/companies - Le Super Admin crée une compagnie et désigne son Responsable
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Action réservée au Super Admin." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      code,
      settlementMomoNumber,
      settlementMomoHolder,
      settlementMomoOperator = "MTN",
      adminFullName,
      adminPhone,
      adminEmail,
    } = body;

    if (!name || !code || !settlementMomoNumber || !settlementMomoHolder) {
      return NextResponse.json(
        { success: false, error: "Nom, code compagnie et coordonnées Mobile Money requis." },
        { status: 400 }
      );
    }

    if (!adminFullName || (!adminPhone && !adminEmail)) {
      return NextResponse.json(
        { success: false, error: "Nom et contact (téléphone ou e-mail) du responsable requis." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Créer la compagnie
    const cleanCode = String(code).trim().toUpperCase();
    const company = await Company.create({
      name: String(name).trim(),
      code: cleanCode,
      commission: {
        type: "FIXED",
        value: 500,
        paidBy: "PASSENGER",
      },
      settlementMomo: {
        operator: settlementMomoOperator,
        number: String(settlementMomoNumber).trim(),
        holderName: String(settlementMomoHolder).trim(),
        preferredTime: "H_MINUS_1",
      },
      stations: [],
      isActive: true,
    });

    // 2. Créer ou assigner le compte du Responsable Compagnie (COMPANY_ADMIN)
    const cleanEmail = adminEmail ? String(adminEmail).trim().toLowerCase() : undefined;
    const cleanPhone = adminPhone ? String(adminPhone).trim() : `admin_${cleanCode}_${Date.now()}`;

    const existingUser = await User.findOne({
      $or: [
        ...(cleanEmail ? [{ email: cleanEmail }] : []),
        { phone: cleanPhone },
      ],
    });

    let adminUser;
    if (existingUser) {
      existingUser.role = "COMPANY_ADMIN";
      existingUser.companyId = company._id;
      existingUser.fullName = String(adminFullName).trim();
      existingUser.isActive = true;
      await existingUser.save();
      adminUser = existingUser;
    } else {
      adminUser = await User.create({
        firebaseUid: `comp_admin_${Date.now()}`,
        fullName: String(adminFullName).trim(),
        phone: cleanPhone,
        email: cleanEmail,
        role: "COMPANY_ADMIN",
        companyId: company._id,
        referralCode: `KWR${cleanCode}`,
        isProfileCompleted: true,
        isActive: true,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Compagnie créée et compte Responsable activé avec succès.",
        data: {
          company,
          adminUser: {
            id: adminUser._id,
            fullName: adminUser.fullName,
            role: adminUser.role,
            phone: adminUser.phone,
            email: adminUser.email,
          },
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur création compagnie";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

