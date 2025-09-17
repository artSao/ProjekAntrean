// import { NextResponse, type NextRequest } from "next/server";
// import { verifyAuth } from "@/lib/auth";

// const allowedOrigins = [
//   "http://localhost:3001",
//   // "https://app-bengkel-anda.com",
// ];

// function applyCorsHeaders(response: NextResponse, origin: string) {
//   if (allowedOrigins.includes(origin)) {
//     response.headers.set("Access-Control-Allow-Origin", origin);
//     response.headers.set("Access-Control-Allow-Credentials", "true");
//     response.headers.set(
//       "Access-Control-Allow-Methods",
//       "GET, POST, PUT, DELETE, PATCH, OPTIONS"
//     );
//     response.headers.set(
//       "Access-Control-Allow-Headers",
//       "Content-Type, Authorization"
//     );
//   }
//   return response;
// }

// export async function middleware(request: NextRequest) {
//   const origin = request.headers.get("origin") ?? "";

//   // handle preflight
//   if (request.method === "OPTIONS") {
//     const response = new NextResponse(null, { status: 204 });
//     return applyCorsHeaders(response, origin);
//   }

  

//   // 🔑 cek token
//   const tokenPayload = verifyAuth(request);

//   // --- untuk API ---
//   if (request.nextUrl.pathname.startsWith("/api")) {
//     if (!tokenPayload) {
//       const errorResponse = NextResponse.json(
//         { error: "Unauthorized", message: "Token tidak valid atau tidak ada" },
//         { status: 401 }
//       );
//       return applyCorsHeaders(errorResponse, origin);
//     }

//     const response = NextResponse.next();
//     response.headers.set("X-User-Payload", JSON.stringify(tokenPayload));
//     return applyCorsHeaders(response, origin);
//   }

//   // --- untuk WEB (dashboard) ---
//   if (request.nextUrl.pathname.startsWith("/dashboard")) {
//     // kalau belum login → redirect ke login
//     if (!tokenPayload) {
//       return NextResponse.redirect(new URL("/login?error=unauthenticated", request.url));
//     }

//     // kalau login tapi role bukan admin/branch_admin → redirect ke login
//     if (!["ADMIN", "BRANCH_ADMIN"].includes(tokenPayload.role)) {
//       return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     "/api/((?!auth/).*)", // proteksi API kecuali /api/auth/*
//     "/dashboard/:path*",  // proteksi semua halaman dashboard
//   ],
//   runtime: "nodejs", // tambahin ini supaya jsonwebtoken bisa jalan
// };


import { NextResponse, type NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth";

const allowedOrigins = [
  "http://localhost:3001",
  // "https://app-bengkel-anda.com",
];

function applyCorsHeaders(response: NextResponse, origin: string) {
  if (allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const { pathname } = request.nextUrl;

  // handle preflight
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    return applyCorsHeaders(response, origin);
  }

  // 🔑 cek token
  const tokenPayload = verifyAuth(request);

  // --- API route ---
  if (pathname.startsWith("/api")) {
    if (!tokenPayload) {
      const errorResponse = NextResponse.json(
        { error: "Unauthorized", message: "Token tidak valid atau tidak ada" },
        { status: 401 }
      );
      return applyCorsHeaders(errorResponse, origin);
    }

    const response = NextResponse.next();
    response.headers.set("X-User-Payload", JSON.stringify(tokenPayload));
    return applyCorsHeaders(response, origin);
  }

  // --- Halaman Dashboard ---
  if (pathname.startsWith("/dashboard")) {
    if (!tokenPayload) {
      return NextResponse.redirect(new URL("/login?error=unauthenticated", request.url));
    }

    if (!["ADMIN", "BRANCH_ADMIN"].includes(tokenPayload.role)) {
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
    }
  }

  // --- Halaman Login ---
  if (pathname.startsWith("/login")) {
    if (tokenPayload) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/((?!auth/).*)", // proteksi API kecuali /api/auth/*
    "/dashboard/:path*",  // proteksi semua halaman dashboard
    "/login",             // proteksi halaman login (redirect kalau sudah login)
  ],
  runtime: "nodejs",
};
