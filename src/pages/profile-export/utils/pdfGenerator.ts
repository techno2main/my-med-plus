import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExportData } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export const generatePDF = async (data: ExportData): Promise<void> => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('MyHealth+ - Export M├®dical', 105, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Date d'export : ${format(new Date(data.exportDate), 'dd/MM/yyyy ├á HH:mm', { locale: fr })}`, 105, yPosition, { align: 'center' });
  yPosition += 5;

  if (data.period.startDate || data.period.endDate) {
    const periodText = `P├®riode : ${data.period.startDate ? format(new Date(data.period.startDate), 'dd/MM/yyyy') : '...'} - ${data.period.endDate ? format(new Date(data.period.endDate), 'dd/MM/yyyy') : '...'}`;
    doc.text(periodText, 105, yPosition, { align: 'center' });
  }
  yPosition += 15;

  // Profile
  if (data.profile) {
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Profil Patient', 14, yPosition);
    yPosition += 8;

    const profileData = [
      ['Nom', `${data.profile.firstName} ${data.profile.lastName}`],
      ['Date de naissance', data.profile.dateOfBirth ? format(new Date(data.profile.dateOfBirth), 'dd/MM/yyyy') : '-'],
      ['Groupe sanguin', data.profile.bloodType || '-'],
      ['Taille', data.profile.height ? `${data.profile.height} cm` : '-'],
      ['Poids', data.profile.weight ? `${data.profile.weight} kg` : '-'],
      ['T├®l├®phone', data.profile.phone || '-'],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: profileData,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Adherence
  if (data.adherence) {
    checkPageBreak(doc, yPosition, 60);
    
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Statistiques d\'Observance', 14, yPosition);
    yPosition += 8;

    const adherenceData = [
      ['Prises ├á l\'heure', data.adherence.takenOnTime.toString()],
      ['Prises en retard', data.adherence.lateIntakes.toString()],
      ['Prises manqu├®es', data.adherence.skipped.toString()],
      ['Observance 7 jours', `${data.adherence.adherence7Days}% (${data.adherence.total7Days} prises)`],
      ['Observance 30 jours', `${data.adherence.adherence30Days}% (${data.adherence.total30Days} prises)`],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: adherenceData,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Treatments
  if (data.treatments && data.treatments.length > 0) {
    checkPageBreak(doc, yPosition, 40);
    
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Traitements', 14, yPosition);
    yPosition += 8;

    data.treatments.forEach((treatment, index) => {
      checkPageBreak(doc, yPosition, 50);
      
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text(`${index + 1}. ${treatment.name}`, 14, yPosition);
      yPosition += 6;

      const treatmentInfo = [
        ['Pathologie', treatment.pathology || '-'],
        ['Date de d├®but', format(new Date(treatment.startDate), 'dd/MM/yyyy')],
        ['Date de fin', treatment.endDate ? format(new Date(treatment.endDate), 'dd/MM/yyyy') : 'En cours'],
        ['Statut', treatment.isActive ? 'Actif' : 'Inactif'],
      ];

      if (treatment.description) {
        treatmentInfo.push(['Description', treatment.description]);
      }

      autoTable(doc, {
        startY: yPosition,
        head: [],
        body: treatmentInfo,
        theme: 'plain',
        styles: { fontSize: 9 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
        },
        margin: { left: 20 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 5;

      if (treatment.medications.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text('M├®dicaments :', 20, yPosition);
        yPosition += 5;

        const medicationsData = treatment.medications.map(m => [
          m.name,
          m.dosage,
          m.times.join(', '),
          m.currentStock ? `${m.currentStock}/${m.minThreshold}` : '-',
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Nom', 'Dosage', 'Horaires', 'Stock']],
          body: medicationsData,
          theme: 'striped',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [100, 100, 100] },
          margin: { left: 25 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 8;
      }
    });
  }

  // Prescriptions
  if (data.prescriptions && data.prescriptions.length > 0) {
    checkPageBreak(doc, yPosition, 40);
    
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Ordonnances', 14, yPosition);
    yPosition += 8;

    const prescriptionsData = data.prescriptions.map(p => [
      format(new Date(p.prescriptionDate), 'dd/MM/yyyy'),
      p.doctorName || '-',
      `${p.durationDays} jours`,
      p.treatments.join(', ') || '-',
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'M├®decin', 'Dur├®e', 'Traitements']],
      body: prescriptionsData,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [100, 100, 100] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Intake History
  if (data.intakeHistory && data.intakeHistory.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Historique des Prises', 14, yPosition);
    yPosition += 8;

    const intakesData = data.intakeHistory.slice(0, 100).map(i => [
      i.date,
      i.medicationName,
      i.treatmentName,
      i.scheduledTime,
      i.takenAt || '-',
      getStatusLabel(i.status),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'M├®dicament', 'Traitement', 'Pr├®vu', 'Pris', 'Statut']],
      body: intakesData,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [100, 100, 100] },
      columnStyles: {
        1: { cellWidth: 40 },
        2: { cellWidth: 35 },
      },
    });

    if (data.intakeHistory.length > 100) {
      yPosition = (doc as any).lastAutoTable.finalY + 5;
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`(Affichage limit├® aux 100 derni├¿res prises sur ${data.intakeHistory.length})`, 14, yPosition);
    }
  }

  // Stocks
  if (data.stocks && data.stocks.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('├ëtat des Stocks', 14, yPosition);
    yPosition += 8;

    const stocksData = data.stocks.map(s => [
      s.medicationName,
      s.treatmentName,
      s.currentStock.toString(),
      s.minThreshold.toString(),
      getStockStatusLabel(s.status),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['M├®dicament', 'Traitement', 'Stock actuel', 'Seuil minimum', 'Statut']],
      body: stocksData,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [100, 100, 100] },
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`MyHealth+ - Page ${i}/${pageCount}`, 105, 290, { align: 'center' });
  }

  // Save - différent comportement selon la plateforme
  const fileName = `MyHealthPlus_Export_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
  
  if (Capacitor.isNativePlatform()) {
    // Sur Android/iOS : utiliser Capacitor Filesystem
    try {
      const pdfOutput = doc.output('dataurlstring');
      const base64Data = pdfOutput.split(',')[1];
      
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
      });
      
      console.log('PDF sauvegardé:', result.uri);
      
      // Optionnel : ouvrir le fichier avec l'app par défaut
      // Note: nécessiterait le plugin @capacitor/file-opener
      
    } catch (error) {
      console.error('Erreur sauvegarde PDF:', error);
      throw error;
    }
  } else {
    // Sur Web : téléchargement classique
    doc.save(fileName);
  }
};

const checkPageBreak = (doc: jsPDF, currentY: number, requiredSpace: number): number => {
  if (currentY + requiredSpace > 280) {
    doc.addPage();
    return 20;
  }
  return currentY;
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    taken: 'Prise',
    skipped: 'Manqu├®e',
    pending: 'En attente',
  };
  return labels[status] || status;
};

const getStockStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    ok: 'OK',
    low: 'Faible',
    critical: 'Critique',
  };
  return labels[status] || status;
};
