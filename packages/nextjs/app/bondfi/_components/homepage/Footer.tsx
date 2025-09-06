"use client";

import Link from "next/link";
import { Github, Twitter, FileText } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 text-gray-300">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img 
                src="https://res.cloudinary.com/ecosheane/image/upload/v1756552072/Logo_jvn2t4.png" 
                alt="BondFi Logo" 
                className="h-8"
              />
              <span className="text-xl font-bold text-white">BondFi</span>
            </div>
            <p className="text-gray-400">
              Building the future of decentralized finance for African communities.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3 text-white">Platform</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/bondfi/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Analytics</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3 text-white">Resources</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security Audit</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Whitepaper</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3 text-white">Community</h3>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <FileText className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        
        {/* Footer bottom section can be added back later if needed */}
      </div>
    </footer>
  );
}
