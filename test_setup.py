#!/usr/bin/env python3
"""
Comprehensive setup verification script for Landslide IoT System
Tests Python dependencies, Convex connectivity, and other components
"""

import sys
import subprocess
import json
from pathlib import Path

def print_section(title):
    """Print a formatted section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_python_packages():
    """Test Python package imports"""
    print_section("🐍 Python Dependencies")
    
    packages = {
        'requests': 'HTTP requests',
        'numpy': 'Numerical computing',
        'dotenv': 'Environment variables',
        'flask': 'Web framework'
    }
    
    results = {}
    for package, description in packages.items():
        try:
            if package == 'dotenv':
                __import__('dotenv')
            else:
                __import__(package)
            print(f"  ✓ {package:20} - {description}")
            results[package] = True
        except ImportError:
            print(f"  ✗ {package:20} - {description} [MISSING]")
            results[package] = False
    
    return all(results.values())

def test_backend_files():
    """Check backend Python files"""
    print_section("📂 Backend Files Structure")
    
    backend_files = [
        'app.py',
        'anomaly_detector.py',
        'convex_client.py',
        'requirements.txt',
        '.env'
    ]
    
    backend_path = Path('backend')
    results = {}
    for file in backend_files:
        exists = (backend_path / file).exists()
        status = "✓" if exists else "✗"
        print(f"  {status} backend/{file}")
        results[file] = exists
    
    return all(results.values())

def test_nextjs_webapp():
    """Check Next.js web app setup"""
    print_section("⚛️ Next.js Web App")
    
    webapp_files = [
        'web-app/package.json',
        'web-app/tsconfig.json',
        'web-app/next.config.mjs',
        'web-app/components/Providers.tsx',
        'web-app/app/layout.tsx'
    ]
    
    results = {}
    for file in webapp_files:
        exists = Path(file).exists()
        status = "✓" if exists else "✗"
        print(f"  {status} {file}")
        results[file] = exists
    
    return all(results.values())

def test_convex_setup():
    """Check Convex configuration"""
    print_section("🔌 Convex Configuration")
    
    convex_files = [
        'web-app/convex/schema.ts',
        'web-app/convex/sensorData.ts',
        'web-app/convex/http.ts',
        'web-app/convex/_generated/api.d.ts'
    ]
    
    results = {}
    for file in convex_files:
        exists = Path(file).exists()
        status = "✓" if exists else "✗"
        print(f"  {status} {file}")
        results[file] = exists
    
    # Check environment variable in backend
    import os
    from dotenv import load_dotenv
    load_dotenv('backend/.env')
    
    convex_url = os.getenv('CONVEX_URL')
    if convex_url:
        print(f"  ✓ CONVEX_URL configured: {convex_url[:40]}...")
    else:
        print(f"  ✗ CONVEX_URL not found in environment")
    
    return all(results.values()) and bool(convex_url)

def test_clerk_setup():
    """Check Clerk configuration"""
    print_section("🔐 Clerk Authentication")
    
    print("  Configuration needed in environment variables:")
    print("  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")
    print("  - CLERK_SECRET_KEY")
    print("\n  File checks:")
    
    clerk_files = [
        'web-app/components/Providers.tsx',
        'web-app/app/layout.tsx'
    ]
    
    results = {}
    for file in clerk_files:
        exists = Path(file).exists()
        status = "✓" if exists else "✗"
        print(f"  {status} {file}")
        results[file] = exists
    
    return all(results.values())

def test_firmware():
    """Check firmware setup"""
    print_section("🔧 Firmware")
    
    firmware_file = 'firmware/slope_sentry.ino'
    exists = Path(firmware_file).exists()
    status = "✓" if exists else "✗"
    print(f"  {status} {firmware_file}")
    
    return exists

def test_convex_connectivity():
    """Test Convex API connectivity"""
    print_section("🌐 Convex API Connectivity")
    
    try:
        import os
        from dotenv import load_dotenv
        import requests
        
        load_dotenv('backend/.env')
        convex_url = os.getenv('CONVEX_URL')
        
        if not convex_url:
            print("  ✗ CONVEX_URL not configured")
            return False
        
        print(f"  Testing connection to: {convex_url}")
        
        # Try a basic health check
        response = requests.get(convex_url, timeout=5)
        if response.status_code in [200, 302, 401]:  # 401 is expected if no auth
            print(f"  ✓ Convex URL is accessible (HTTP {response.status_code})")
            return True
        else:
            print(f"  ✗ Unexpected response (HTTP {response.status_code})")
            return False
    except requests.exceptions.ConnectionError:
        print("  ✗ Cannot connect to Convex URL (check internet connection)")
        return False
    except requests.exceptions.Timeout:
        print("  ✗ Connection timeout to Convex")
        return False
    except Exception as e:
        print(f"  ✗ Error testing Convex: {e}")
        return False

def main():
    """Run all tests"""
    print("\n")
    print("╔" + "═"*58 + "╗")
    print("║" + " "*15 + "LANDSLIDE IoT SYSTEM - SETUP TEST" + " "*10 + "║")
    print("╚" + "═"*58 + "╝")
    
    results = {
        'Python Packages': test_python_packages(),
        'Backend Files': test_backend_files(),
        'Next.js Web App': test_nextjs_webapp(),
        'Convex Setup': test_convex_setup(),
        'Clerk Setup': test_clerk_setup(),
        'Firmware': test_firmware(),
        'Convex Connectivity': test_convex_connectivity(),
    }
    
    print_section("📊 Test Summary")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status:8} - {test_name}")
    
    print(f"\n  Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n  ✓ All systems ready! You can proceed with development.")
    else:
        print(f"\n  ⚠ {total - passed} issue(s) need attention.")
    
    return 0 if passed == total else 1

if __name__ == '__main__':
    sys.exit(main())
