import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCentres, getSlotsByCentreId, createNotificationRecord } from '@/lib/db';

export async function POST(request) {
  try {
    const user = await getCurrentUser();

    const body = await request.json();
    const { cropName = 'Wheat', quantity = 100, unit = 'Quintal', harvestDate } = body;
    const numQty = Number(quantity) || 100;

    const centres = getCentres();

    // Recommendation scoring logic based on actual data factors:
    // Factors: Distance (closer = higher), Crowd/Queue (Low > Med > High), Capacity availability, Harvest date suitability
    const scoredCentres = centres.map((centre) => {
      let score = 100;

      // Distance factor (shorter distance gets higher score)
      if (centre.distanceKm <= 10) {
        score += 15;
      } else if (centre.distanceKm <= 20) {
        score += 5;
      } else {
        score -= (centre.distanceKm - 20) * 1.2;
      }

      // Crowd & queue factor
      if (centre.currentCrowd === 'Low') {
        score += 12;
      } else if (centre.currentCrowd === 'Medium') {
        score -= 5;
      } else if (centre.currentCrowd === 'High') {
        score -= 20;
      }

      // Capacity factor (lower utilization = higher available headroom)
      if (centre.todayCapacityPercent < 75) {
        score += 10;
      } else if (centre.todayCapacityPercent > 85) {
        score -= 10;
      }

      // Quantity suitability factor
      if (numQty >= 50 && (unit === 'Quintal' || unit === 'Ton') && centre.distanceKm < 20) {
        score += 8;
      }

      const slots = getSlotsByCentreId(centre.id);
      const recommendedSlot = slots.find((s) => s.isRecommended) || slots[0] || {
        timeSlot: centre.recommendedTimeSlot || '11:30 AM – 12:00 PM',
        crowdLevel: centre.currentCrowd,
        estimatedWait: centre.estimatedWaitMins,
      };

      // Formulate genuine explanation from actual factors
      let reasonParts = [];
      if (centre.distanceKm <= 10) {
        reasonParts.push(`centre is only ${centre.distanceKm} km away`);
      } else {
        reasonParts.push(`reachable depot (${centre.distanceKm} km)`);
      }

      if (centre.currentCrowd === 'Low') {
        reasonParts.push(`current unloading queue is low (~${centre.estimatedWaitMins} mins wait)`);
      } else {
        reasonParts.push(`steady unloading rate (~${centre.estimatedWaitMins} mins queue)`);
      }

      if (centre.todayCapacityPercent < 80) {
        reasonParts.push(`ample capacity to process ${numQty} ${unit} of ${cropName}`);
      } else {
        reasonParts.push(`slots open for ${numQty} ${unit}`);
      }

      const dynamicReason = `Suitable because the ${reasonParts.join(', and ')}.`;

      const finalSuitabilityPercent = Math.min(99, Math.max(68, Math.round(score)));

      // If harvestDate is provided, formulate slot date
      let slotDate = centre.recommendedDate || '18 September 2026';
      if (harvestDate) {
        // Format harvestDate nicely if possible or use as base
        try {
          const hd = new Date(harvestDate);
          if (!isNaN(hd.getTime())) {
            slotDate = hd.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
          }
        } catch {
          // fallback to centre date
        }
      }

      return {
        id: centre.id,
        name: centre.name,
        address: centre.address,
        distanceKm: centre.distanceKm,
        distanceText: `${centre.distanceKm} km away`,
        availableDate: slotDate,
        availableTimeSlot: recommendedSlot.timeSlot || centre.recommendedTimeSlot,
        queueLevel: centre.currentCrowd,
        estimatedWaitMins: centre.estimatedWaitMins,
        capacityText: centre.todayCapacityPercent < 85 ? 'Available' : 'Limited',
        capacityPercent: centre.todayCapacityPercent,
        availableSlotsCount: centre.availableSlotsCount,
        suitabilityPercent: finalSuitabilityPercent,
        isBestMatch: false, // will be assigned to top rank
        recommendationReason: dynamicReason,
        cropName,
        quantity: numQty,
        unit,
      };
    });

    // Sort by suitability score descending
    scoredCentres.sort((a, b) => b.suitabilityPercent - a.suitabilityPercent);

    // Pick top 3 recommendations as specified in requirements
    const recommendations = scoredCentres.slice(0, 3);

    // Ensure the top one is marked as Best Match
    if (recommendations.length > 0) {
      recommendations[0].isBestMatch = true;
    }

    // Create persistent notification for authenticated farmer if session exists
    if (user && user.id) {
      createNotificationRecord({
        userId: user.id,
        type: 'reminder',
        title: `Recommended slots found for ${cropName}`,
        description: `Generated optimal procurement slots for ${numQty} ${unit} ${cropName}. Top match: ${recommendations[0]?.name}.`,
        icon: 'Sparkles',
      });
    }

    return NextResponse.json({
      success: true,
      cropName,
      quantity: numQty,
      unit,
      harvestDate: harvestDate || '',
      recommendations,
    });
  } catch (err) {
    console.error('Error in POST /api/farmer/slots/recommend:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
