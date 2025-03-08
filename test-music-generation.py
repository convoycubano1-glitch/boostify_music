import json
import requests
import time
import sys
import os

# URL base para las solicitudes
BASE_URL = "http://localhost:5000"

def test_generate_music_without_auth():
    """Prueba la generación de música sin autenticación"""
    print("Prueba 1: Generación de música sin autenticación")
    payload = {
        "prompt": "A melodic pop song with upbeat rhythm",
        "model": "music-s",
        "title": "Test Song"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/music/generate", json=payload, timeout=10)
        print(f"  Status code: {response.status_code}")
        print(f"  Response: {response.json()}")
        
        # Verificar que la solicitud fue rechazada por falta de autenticación
        if response.status_code == 401:
            print("  ✅ Prueba exitosa: Se rechazó la solicitud por falta de autenticación")
        else:
            print("  ❌ Prueba fallida: La solicitud debería haber sido rechazada con código 401")
    except Exception as e:
        print(f"  ❌ Error durante la prueba: {e}")

def get_status_without_task_id():
    """Prueba verificar el estado sin proporcionar un ID de tarea"""
    print("\nPrueba 2: Verificar estado sin ID de tarea")
    
    try:
        response = requests.get(f"{BASE_URL}/api/music/status", timeout=5)
        print(f"  Status code: {response.status_code}")
        
        if response.status_code == 400:
            print("  ✅ Prueba exitosa: Se rechazó la solicitud por falta de ID de tarea")
        else:
            print("  ❌ Prueba fallida: La solicitud debería haber sido rechazada con código 400")
            
    except Exception as e:
        print(f"  ❌ Error durante la prueba: {e}")

def get_status_with_invalid_task_id():
    """Prueba verificar el estado con un ID de tarea inválido"""
    print("\nPrueba 3: Verificar estado con ID de tarea inválido")
    
    try:
        response = requests.get(f"{BASE_URL}/api/music/status?taskId=invalid_task_id", timeout=5)
        print(f"  Status code: {response.status_code}")
        
        if response.status_code == 404:
            print("  ✅ Prueba exitosa: Se rechazó la solicitud por ID de tarea inválido")
        else:
            print(f"  ❌ Prueba fallida: La solicitud debería haber sido rechazada con código 404, recibió {response.status_code}")
            try:
                print(f"  Respuesta: {response.json()}")
            except:
                print(f"  Respuesta: {response.text}")
            
    except Exception as e:
        print(f"  ❌ Error durante la prueba: {e}")

def test_get_history_without_auth():
    """Prueba obtener el historial de generaciones sin autenticación"""
    print("\nPrueba 4: Obtener historial sin autenticación")
    
    try:
        response = requests.get(f"{BASE_URL}/api/music/recent", timeout=5)
        print(f"  Status code: {response.status_code}")
        
        if response.status_code == 401:
            print("  ✅ Prueba exitosa: Se rechazó la solicitud por falta de autenticación")
        else:
            print("  ❌ Prueba fallida: La solicitud debería haber sido rechazada con código 401")
            
    except Exception as e:
        print(f"  ❌ Error durante la prueba: {e}")

if __name__ == "__main__":
    test_generate_music_without_auth()
    get_status_without_task_id()
    get_status_with_invalid_task_id()
    test_get_history_without_auth()
    
    print("\n✅ Pruebas completadas")