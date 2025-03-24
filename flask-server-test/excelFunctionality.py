from flask import Blueprint, jsonify, request
import os
import pandas as pd
from openpyxl import Workbook
from flask_cors import cross_origin

excel_bp = Blueprint('excel', __name__)

@excel_bp.route('/upload', methods=['POST'])
@cross_origin()
def upload_excel():
    data = request.get_json()
    route_name = data.get("routeName", "Uusi_reitti")
    excel_data = data.get("data", [])
    
    wb = Workbook()
    ws = wb.active
    ws.title = "Luetut paikat"
    
    ws["A1"] = "Reitin nimi:"
    ws["B1"] = route_name
    
    header = ["Nimi", "Osoite", "Postinumero", "Kaupunki", "Vakionouto", "Lat", "Lon"]
    ws.append(header)
    
    for item in excel_data:
        ws.append([
            item.get("name"),
            item.get("address"),
            item.get("postalCode"),
            item.get("city"),
            item.get("standardPickup"),
            item.get("lat"),
            item.get("lon")
        ])
    
    save_dir = os.path.join(".secret", "ExcelFiles")
    if not os.path.exists(save_dir):
        os.makedirs(save_dir, exist_ok=True)
    
    file_path = os.path.join(save_dir, f"{route_name}.xlsx")
    
    try:
        wb.save(file_path)
        return jsonify({"message": "Tiedosto tallennettu onnistuneesti", "file_path": file_path}), 200
    except Exception as e:
        return jsonify({"error": True, "message": f"Tiedoston tallennus epäonnistui: {e}"}), 500

@excel_bp.route('/api/get_excel_jsons', methods=['GET'])
@cross_origin()
def get_excel_jsons():
    folder = os.path.join(".secret", "ExcelFiles")
    excel_jsons = {}
    
    if os.path.exists(folder):
        for file_name in os.listdir(folder):
            if file_name.endswith(".xlsx"):
                file_path = os.path.join(folder, file_name)
                try:
                    df = pd.read_excel(file_path, header=1)
                    
                    mapping = {
                        "Nimi": "name",
                        "Testi": "address",
                        "Unnamed: 2": "postalCode",
                        "Unnamed: 3": "city",
                        "Unnamed: 4": "standardPickup",
                        "Unnamed: 5": "lat",
                        "Unnamed: 6": "lon"
                    }
                    df.rename(columns=mapping, inplace=True)
                    
                    if "standardPickup" in df.columns:
                        df["standardPickup"] = df["standardPickup"].apply(
                            lambda x: "yes" if str(x).strip().lower() == "x" else "no"
                        )
                    
                    records = df.to_dict(orient="records")
                    
                    base_name = os.path.splitext(file_name)[0]
                    excel_jsons[base_name] = records
                except Exception as e:
                    print(f"Virhe tiedostoa {file_name} lukiessa: {e}")
                    base_name = os.path.splitext(file_name)[0]
                    excel_jsons[base_name] = {"error": str(e)}
    else:
        return jsonify({"error": "Kansiota ei löydy"}), 404
    
    return jsonify(excel_jsons)

@excel_bp.route('/api/delete_excel', methods=['DELETE'])
@cross_origin()
def delete_excel():
    data = request.get_json()
    file_name = data.get("file_name")
    if not file_name:
        return jsonify({"error": "file_name not provided"}), 400

    if not file_name.endswith(".xlsx"):
        file_name_full = file_name + ".xlsx"
    else:
        file_name_full = file_name

    folder = os.path.join(".secret", "ExcelFiles")
    file_path = os.path.join(folder, file_name_full)
    
    if not os.path.exists(file_path):
        return jsonify({"error": "Tiedostoa ei löytynyt"}), 404

    try:
        os.remove(file_path)
        return jsonify({"message": "Tiedosto poistettu onnistuneesti", "file_name": file_name_full}), 200
    except Exception as e:
        return jsonify({"error": True, "message": f"Tiedoston poisto epäonnistui: {e}"}), 500
