import os
import glob
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Preformatted
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def create_project_pdf(output_pdf="mon_projet_studio.pdf"):
    print("=== Début de la création du PDF du projet ===")
    
    # Configuration du document PDF (marges réduites pour maximiser l'espace de code)
    doc = SimpleDocTemplate(
        output_pdf,
        pagesize=letter,
        rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30
    )
    
    styles = getSampleStyleSheet()
    
    # Styles typographiques professionnels pour Google Studio
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1A365D'), # Bleu foncé
        spaceAfter=15
    )
    
    file_header_style = ParagraphStyle(
        'FileHeaderStyle',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#2B6CB0'), # Bleu clair
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True # Évite d'isoler le nom du fichier en bas de page
    )
    
    code_style = ParagraphStyle(
        'CodeStyle',
        fontName='Courier', # Police type machine à écrire pour le code
        fontSize=8.5,
        leading=10,
        textColor=colors.HexColor('#2D3748'),
        spaceAfter=10
    )
    
    story = []
    
    # En-tête du document
    story.append(Paragraph("Code Source Complet du Projet", title_style))
    story.append(Paragraph("Généré pour analyse dans l'espace Canvas de Google Studio", styles['Normal']))
    story.append(Spacer(1, 10))
    
    # Extensions à regrouper
    extensions = ['*.ts', '*.tsx', '*.json', '*.html', '*.js', '*.css']
    files_to_process = []
    
    # 1. Recherche des fichiers à la racine
    for ext in extensions:
        files_to_process.extend(glob.glob(ext))
        
    # 2. Recherche récursive dans les sous-dossiers importants (src, api, etc.)
    subfolders = ['src', 'api', 'scripts']
    for folder in subfolders:
        if os.path.exists(folder):
            for ext in extensions:
                files_to_process.extend(glob.glob(os.path.join(folder, '**', ext), recursive=True))
                
    # Dossiers et fichiers critiques à EXCLURE obligatoirement
    exclude_keywords = ['node_modules', 'dist', '.env', 'package-lock.json', 'generer_pdf_projet.py']
    
    processed_count = 0
    
    for file_path in sorted(files_to_process):
        # Filtrer les exclusions
        if any(exclude in file_path for exclude in exclude_keywords):
            continue
            
        if os.path.isdir(file_path):
            continue
            
        print(f"📄 Ajout de : {file_path}")
        story.append(Paragraph(f"📌 FICHIER : {file_path}", file_header_style))
        story.append(Spacer(1, 2))
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Échappement obligatoire des balises HTML pour éviter les crashs de rendu ReportLab
                content_escaped = content.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                
                # Preformatted conserve l'indentation et les retours à la ligne exacts du code
                story.append(Preformatted(content_escaped, code_style))
        except Exception as e:
            story.append(Paragraph(f"// Erreur lors du décodage du fichier : {str(e)}", code_style))
            
        story.append(Spacer(1, 8))
        processed_count += 1
        
    if processed_count == 0:
        story.append(Paragraph("Aucun fichier détecté. Vérifiez l'emplacement du script.", styles['Normal']))
    else:
        doc.build(story)
        print(f"\\n=== Succès ! Fichier généré : {output_pdf} ===")
        print(f"=== {processed_count} fichiers fusionnés avec succès ! ===")

if __name__ == '__main__':
    create_project_pdf()