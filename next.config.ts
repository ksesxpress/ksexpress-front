import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permet d'accéder au serveur de dev depuis un autre appareil du réseau
  // local (ex. tester le rendu mobile sur un téléphone réel).
  allowedDevOrigins: ["192.168.1.106"],
};

export default nextConfig;
