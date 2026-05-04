import os

def build_preview():
    try:
        with open("index.html", "r") as f:
            html = f.read()
        
        with open("css.html", "r") as f:
            css = f.read()
            
        with open("js.html", "r") as f:
            js = f.read()
            
        html = html.replace("<?!= include('css'); ?>", css)
        html = html.replace("<?!= include('js'); ?>", js)
        
        with open("preview.html", "w") as f:
            f.write(html)
            
        print("Successfully built preview.html")
        os.system("open preview.html")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    build_preview()
