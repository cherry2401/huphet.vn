import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, string>;
    
    // Only allow specific keys to be updated for security
    const allowedKeys = [
      "AFFILIATE_ID",
      "AFFILIATE_SUB_ID1",
      "AFFILIATE_CUSTOM_LINK_API_URL",
      "TIENVE_FLASH_DEALS_API_URL",
      "TIENVE_CACHE_PAGE_URL",
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_CACHE_TABLE",
      "ACCESSTRADE_TOKEN",
    ];

    const envPath = path.resolve(process.cwd(), ".env.local");
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

    let hasChanges = false;
    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        let value = body[key].trim();
        // Xóa dấu nháy đôi nếu có để tránh lỗi cú pháp dot env
        value = value.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
        
        const regex = new RegExp(`^${key}=.*$`, "m");
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
          envContent += (envContent.endsWith("\n") || envContent === "" ? "" : "\n") + `${key}=${value}\n`;
        }
        hasChanges = true;
      }
    }

    if (hasChanges) {
      fs.writeFileSync(envPath, envContent, "utf8");
      
      // Delay PM2 restart so response can reach client first
      if (process.env.NODE_ENV === "production") {
        setTimeout(() => {
          exec("pm2 restart huphet", (err) => {
            if (err) console.error("Failed to restart PM2:", err);
          });
        }, 1500);
      }
    }

    return NextResponse.json({ ok: true, message: "Settings saved successfully." });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
