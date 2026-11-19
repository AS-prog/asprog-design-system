import sys
from pathlib import Path

# El paquete vive dentro de la skill, que es lo que copia APM.
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "plugins" / "documentation" / "skills" / "site" / "scripts"))
