import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { getAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserRole } from "@/models/User";
import { Company } from "@/models/Company";
import { normalizePhoneNumber } from "@/lib/config";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

// GET /api/company/agents - Lister les agents de la compagnie (accessible par COMPANY_ADMIN ou SUPER_ADMIN)
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    const isSuperAdmin = session.role === "SUPER_ADMIN";
    const isCompanyAdmin = session.role === "COMPANY_ADMIN";

    if (!isSuperAdmin && !isCompanyAdmin) {
      return NextResponse.json(
        { success: false, error: "Accès réservé au Responsable de Compagnie ou Super Admin." },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const targetCompanyId = isSuperAdmin ? searchParams.get("companyId") || session.companyId : session.companyId;

    if (!targetCompanyId) {
      return NextResponse.json(
        { success: false, error: "Identifiant de la compagnie manquant." },
        { status: 400 }
      );
    }

    const agents = await User.find({
      companyId: targetCompanyId,
      role: { $in: ["STATION_MANAGER", "TICKET_AGENT", "ONBOARD_CONDUCTOR", "COMPANY_ADMIN"] },
    })
      .select("fullName phone email role stationId assignedTripId isActive createdAt")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: agents });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur chargement agents";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/company/agents - Créer / inviter un agent (Chef de gare, Guichetier, Convoyeur)
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    const isSuperAdmin = session.role === "SUPER_ADMIN";
    const isCompanyAdmin = session.role === "COMPANY_ADMIN";

    if (!isSuperAdmin && !isCompanyAdmin) {
      return NextResponse.json(
        { success: false, error: "Seul le Responsable de compagnie ou le Super Admin peut créer un agent." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      fullName,
      phone,
      email,
      role, // STATION_MANAGER, TICKET_AGENT, ONBOARD_CONDUCTOR
      stationId,
      assignedTripId,
      companyId: explicitCompanyId,
    } = body;

    const companyId = isSuperAdmin ? explicitCompanyId || session.companyId : session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Veuillez préciser la compagnie concernée." },
        { status: 400 }
      );
    }

    if (!fullName || (!phone && !email) || !role) {
      return NextResponse.json(
        { success: false, error: "Nom, contact (téléphone ou e-mail) et rôle obligatoires." },
        { status: 400 }
      );
    }

    const ALLOWED_AGENT_ROLES: UserRole[] = ["STATION_MANAGER", "TICKET_AGENT", "ONBOARD_CONDUCTOR"];
    if (!ALLOWED_AGENT_ROLES.includes(role as UserRole)) {
      return NextResponse.json(
        { success: false, error: "Rôle d'agent invalide (doit être Chef de gare, Guichetier ou Convoyeur)." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ success: false, error: "Compagnie introuvable." }, { status: 404 });
    }

    const cleanPhone = phone ? normalizePhoneNumber(String(phone)) : `agent_${Date.now()}`;
    const cleanEmail = email ? String(email).trim().toLowerCase() : undefined;

    // Chercher si l'utilisateur existe déjà
    const existing = await User.findOne({
      $or: [
        { phone: cleanPhone },
        ...(cleanEmail ? [{ email: cleanEmail }] : []),
      ],
    });

    // On ne « recrute » jamais un administrateur ni l'agent d'une autre compagnie.
    if (existing && !isSuperAdmin) {
      const isPrivileged = existing.role === "SUPER_ADMIN" || existing.role === "COMPANY_ADMIN";
      const belongsElsewhere =
        existing.role !== "PASSENGER" && existing.companyId && existing.companyId.toString() !== String(companyId);
      if (isPrivileged || belongsElsewhere) {
        return NextResponse.json(
          { success: false, error: "Ce compte appartient déjà à une autre structure. Contactez le Super Admin." },
          { status: 409 }
        );
      }
    }

    let agentUser;
    if (existing) {
      existing.fullName = String(fullName).trim();
      existing.role = role as UserRole;
      existing.companyId = company._id;
      existing.stationId = stationId || null;
      existing.assignedTripId = assignedTripId || null;
      existing.isActive = true;
      if (cleanEmail) existing.email = cleanEmail;
      await existing.save();
      agentUser = existing;
    } else {
      agentUser = await User.create({
        firebaseUid: `agent_${Date.now()}`,
        fullName: String(fullName).trim(),
        phone: cleanPhone,
        email: cleanEmail,
        role: role as UserRole,
        companyId: company._id,
        stationId: stationId || null,
        assignedTripId: assignedTripId || null,
        referralCode: `AGT${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        isProfileCompleted: true,
        isActive: true,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Agent ${agentUser.fullName} (${agentUser.role}) enregistré pour ${company.name}.`,
        data: {
          id: agentUser._id,
          fullName: agentUser.fullName,
          phone: agentUser.phone,
          email: agentUser.email,
          role: agentUser.role,
          companyName: company.name,
          isActive: agentUser.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur création agent";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/company/agents - Activer / suspendre un agent ou changer son rôle
export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    const isSuperAdmin = session.role === "SUPER_ADMIN";
    const isCompanyAdmin = session.role === "COMPANY_ADMIN";

    if (!isSuperAdmin && !isCompanyAdmin) {
      return NextResponse.json({ success: false, error: "Accès refusé." }, { status: 403 });
    }

    const body = await req.json();
    const { agentId, isActive, role } = body;

    if (!agentId) {
      return NextResponse.json({ success: false, error: "Identifiant agent requis." }, { status: 400 });
    }

    await connectToDatabase();

    if (!isValidObjectId(agentId)) {
      return NextResponse.json({ success: false, error: "Identifiant agent invalide." }, { status: 400 });
    }
    if (String(agentId) === session.user._id.toString()) {
      return NextResponse.json({ success: false, error: "Vous ne pouvez pas modifier votre propre compte." }, { status: 403 });
    }

    const AGENT_ROLES: UserRole[] = ["STATION_MANAGER", "TICKET_AGENT", "ONBOARD_CONDUCTOR"];
    const ALL_ROLES: UserRole[] = [...AGENT_ROLES, "COMPANY_ADMIN", "SUPER_ADMIN", "PASSENGER"];

    const query: Record<string, unknown> = { _id: agentId };
    if (!isSuperAdmin) {
      // Un responsable ne gère que les agents de terrain de SA compagnie.
      query.companyId = session.companyId;
      query.role = { $in: AGENT_ROLES };
    }

    const updateFields: Record<string, unknown> = {};
    if (typeof isActive === "boolean") updateFields.isActive = isActive;
    if (role) {
      const allowed = isSuperAdmin ? ALL_ROLES : AGENT_ROLES;
      if (!allowed.includes(role as UserRole)) {
        return NextResponse.json({ success: false, error: "Rôle non autorisé." }, { status: 403 });
      }
      updateFields.role = role;
    }
    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ success: false, error: "Aucune modification demandée." }, { status: 400 });
    }

    const updated = await User.findOneAndUpdate(query, { $set: updateFields }, { returnDocument: "after" });
    if (!updated) {
      return NextResponse.json({ success: false, error: "Agent introuvable ou non autorisé." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Compte de l'agent mis à jour.`,
      data: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur modification agent";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

