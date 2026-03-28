import sys
import os

# Add the project root to the python path
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root not in sys.path:
    sys.path.insert(0, root)

from backend.app import app

if __name__ == '__main__':
    app.run(debug=True)
