import os

import requests

# List all files in the user_guide folder via GitHub API
api_url = "https://api.github.com/repos/pandas-dev/pandas/contents/doc/source/user_guide"
resp = requests.get(api_url).json()
file_count = 0
os.makedirs("pandas_docs", exist_ok=True)

for file in resp:
    if file["name"].endswith(".rst"):
        content = requests.get(file["download_url"]).text
        with open(f"pandas_docs/{file['name']}", "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Saved {file['name']}")
        file_count += 1

print(f"Total files saved: {file_count}")