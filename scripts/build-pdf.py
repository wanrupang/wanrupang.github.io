"""Generate the downloadable public CV from the same content as the website."""
import hashlib
import json
import shutil
from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable

ROOT = Path(__file__).resolve().parent.parent
profile_text = (ROOT / 'content/profile.json').read_text(encoding='utf-8')
papers_text = (ROOT / 'content/publications.json').read_text(encoding='utf-8')
p = json.loads(profile_text)
papers = json.loads(papers_text)
fingerprint = hashlib.sha256((profile_text.strip()+'\n'+papers_text.strip()).encode()).hexdigest()
output = ROOT / 'output/pdf/Wanru-Pang-CV.pdf'
output.parent.mkdir(parents=True, exist_ok=True)
fonts = Path('C:/Windows/Fonts')
for name, file in [('CVSans','arial.ttf'),('CVSans-Bold','arialbd.ttf'),('CVSans-Italic','ariali.ttf'),('CVSans-BoldItalic','arialbi.ttf'),('CVSerif','georgia.ttf'),('CVSerif-Bold','georgiab.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(fonts/file)))
pdfmetrics.registerFontFamily('CVSans',normal='CVSans',bold='CVSans-Bold',italic='CVSans-Italic',boldItalic='CVSans-BoldItalic')
pdfmetrics.registerFont(TTFont('CJK',str(fonts/'simsun.ttc'),subfontIndex=0))
ink = colors.HexColor('#202b28')
accent = colors.HexColor('#28644f')
muted = colors.HexColor('#626c67')
line = colors.HexColor('#d4ded8')
styles = {
    'body': ParagraphStyle('Body',fontName='CVSans',fontSize=9.5,leading=13.6,textColor=ink,spaceAfter=4,splitLongWords=True),
    'small': ParagraphStyle('Small',fontName='CVSans',fontSize=8.6,leading=12,textColor=muted,spaceAfter=3),
    'title': ParagraphStyle('Title',fontName='CVSerif-Bold',fontSize=28,leading=34,textColor=ink,spaceAfter=8),
    'section': ParagraphStyle('Section',fontName='CVSerif-Bold',fontSize=15,leading=19,textColor=accent,spaceBefore=15,spaceAfter=9,keepWithNext=True),
    'sub': ParagraphStyle('Subheading',fontName='CVSans-Bold',fontSize=10.5,leading=15,textColor=ink,spaceBefore=10,spaceAfter=6,keepWithNext=True),
    'bullet': ParagraphStyle('Bullet',fontName='CVSans',fontSize=9.2,leading=13,textColor=ink,leftIndent=9,firstLineIndent=-7,spaceAfter=3),
}
def text(s):
    return escape(str(s)).replace('\u2013','-').replace('\u2014','-').replace('\u2011','-')
def para(s, style='body'):
    return Paragraph(s,styles[style])
def link(label, url):
    return f'<link href="{escape(url, {chr(34):"&quot;"})}" color="#28644f">{text(label)}</link>'
story=[]
width=A4[0]-36*mm
def section(title):
    story.append(para(text(title),'section'))
def block(title, details, dates=''):
    content=[para('<b>'+text(title)+'</b>')]+details
    table=Table([[para(text(dates),'small'),content]],colWidths=[82,width-82],hAlign='LEFT')
    table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(0,0),12),('RIGHTPADDING',(1,0),(1,0),0),('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
    story.append(table)
def records(items):
    for item in items:
        details=[para(text(item['institution']))]
        for field in ['role','supervisor','funding','detail']:
            if item.get(field):
                prefix={'supervisor':'Supervisor: ','funding':'Funded by '}.get(field,'')
                details.append(para(text(prefix+item[field]),'small' if field=='funding' else 'body'))
        details.extend(para('- '+text(d),'bullet') for d in item.get('details',[]))
        block(item['title'],details,item.get('dates',item.get('year','')))
def authors(item):
    names=[('<b>Pang, W.</b>' if name=='Pang, W.' else text(name)) for name in item['authors']]
    return ', '.join(names[:-1])+', &amp; '+names[-1] if len(names)>1 else names[0]
def paper(item, n):
    paper_title=text(item['title'])+('' if item['title'].endswith(('.', '?', '!')) else '.')
    if item['status']=='Published':
        venue=text(item['journal'])
        if item.get('volume'): venue+=', '+text(item['volume'])
        if item.get('number'): venue+='('+text(item['number'])+')'
        if item.get('pages'): venue+=', '+text(item['pages'])
        if item.get('article'): venue+=', '+text(item['article'])
        copy=f'{authors(item)} ({item["year"]}). {paper_title} <i>{venue}</i>.'
        if item.get('details'): copy+=' '+text(item['details'])+'.'
        parts=[para(copy),para(link('https://doi.org/'+item['doi'],'https://doi.org/'+item['doi']),'small')]
    else:
        copy=f'{authors(item)} {paper_title} <i>Under review.</i>'
        if item.get('role')=='Corresponding author': copy+=' Corresponding author: Wanru Pang.'
        parts=[para(copy)]
    table=Table([[para(str(n)+'.','small'),parts]],colWidths=[20,width-20])
    table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),4),('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
    story.append(table)
def conferences(items):
    for item in items:
        details=[para(text(item['authors'])),para('<i>'+text(item['event'])+'</i> - '+text(item['format'])),para(text(item['dates'])+' - '+text(item['location']),'small')]
        block(item['title'],details,str(item['year']))

story += [para('Wanru Pang <font name="CJK" size="17">'+p['nameChinese']+'</font>','title'),para('Curriculum vitae','sub'),para(text(p['title'])+'<br/>'+text(p['department'])+'<br/>'+text(p['institution']))]
if p.get('phdSupervisor'): story.append(para('Supervisor: '+text(p['phdSupervisor'])))
story.append(para(link(p['email'],'mailto:'+p['email'])))
story.append(para(' &nbsp; | &nbsp; '.join(link(x['label'],x['url']) for x in p['links']),'small'))
if p.get('siteUrl'): story.append(para(link(p['siteUrl'],p['siteUrl']),'small'))
story += [Spacer(1,7),HRFlowable(width='100%',thickness=.65,color=line),Spacer(1,2)]
section('Education')
for item in p['education']:
    details=[para(text(item['institution'])),para(text(item['detail']),'small')]
    if item.get('expected') and p.get('phdSupervisor'): details.append(para('Supervisor: '+text(p['phdSupervisor']),'small'))
    block(item['degree'],details,item['detailDates'])
story.append(KeepTogether([para('Doctoral dissertation','sub'),para(text(p['dissertation']))]))
section('Research experience'); records(p['projects'])
section('Visiting study & academic programmes'); records(p['academicVisits'])
section('Peer-reviewed publications')
for n,item in enumerate((x for x in papers if x['status']=='Published'),1): paper(item,n)
section('Manuscripts under review')
for n,item in enumerate((x for x in papers if x['status']=='Under review'),1): paper(item,n)
section('Conference presentations'); conferences([x for x in p['conferences'] if x['status']=='Presented'])
section('Conference submission - Under review'); conferences([x for x in p['conferences'] if x['status']=='Under review'])
section('Teaching & academic service'); records(p['teaching'])
story.append(para('Invited journal peer review - 2023-present','sub'))
story.append(para('; '.join(text(x) for x in p['reviewing'])+'.'))
section('Professional experience & leadership'); records(p['leadership'])
section('Awards & honours'); records(p['awards'])
section('Methods & languages')
for item in p['methods']:
    story.append(KeepTogether([para(text(item['title']),'sub'),para(text(item['detail']))]))
updated=date.fromisoformat(p['updated']).strftime('%B %Y')
def footer(canvas,doc):
    canvas.saveState();canvas.setStrokeColor(line);canvas.setLineWidth(.5)
    canvas.line(18*mm,16*mm,A4[0]-18*mm,16*mm)
    canvas.setFont('CVSans',7.5);canvas.setFillColor(muted)
    canvas.drawString(18*mm,11*mm,'Wanru Pang | Curriculum vitae')
    canvas.drawCentredString(A4[0]/2,11*mm,str(doc.page))
    canvas.drawRightString(A4[0]-18*mm,11*mm,'Updated '+updated)
    canvas.restoreState()
doc=SimpleDocTemplate(str(output),pagesize=A4,rightMargin=18*mm,leftMargin=18*mm,topMargin=17*mm,bottomMargin=22*mm,title='Wanru Pang - Curriculum vitae',author='Wanru Pang',subject='Academic curriculum vitae',keywords='content-sha256:'+fingerprint)
doc.build(story,onFirstPage=footer,onLaterPages=footer)
for target in [ROOT/'assets/Wanru-Pang-CV.pdf',ROOT/'dist/assets/Wanru-Pang-CV.pdf']:
    target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(output,target)
print('Generated complete CV PDF: '+str(output))
