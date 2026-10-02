import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Copy, 
  Lock, 
  Calendar
} from 'lucide-react';

export const AdminAvailability: React.FC = () => {
  const { 
    weeklyAvailability, 
    updateDayAvailability, 
    duplicateScheduleToAllWeekdays,
    blockedSlots,
    toggleBlockSlot,
    currentDate,
    addToast
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'regular' | 'blocked' | 'timeoff'>('regular');
  const [newBlockTime, setNewBlockTime] = useState('11:00');
  const [newBlockReason, setNewBlockReason] = useState('Clinical conference');

  return (
    <div className="space-y-6 max-w-4xl font-sans-clean">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#332B27]/10">
        <div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-normal text-[#332B27]">
            Availability
          </h2>
          <p className="text-xs text-[#332B27]/60 font-sans-clean mt-1">
            Weekly consultation hours and calendar blocks
          </p>
        </div>

        <button
          onClick={() => {
            duplicateScheduleToAllWeekdays('Monday');
            addToast({ title: 'Schedule Copied', message: 'Monday schedule applied to all weekdays.', type: 'success' });
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#332B27]/15 text-xs font-medium text-[#332B27] hover:bg-[#FAF7F0] transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5 text-[#B89552]" />
          <span>Apply Mon to Weekdays</span>
        </button>
      </div>

      {/* Segmented Sub Tabs */}
      <div className="flex items-center gap-1 bg-[#F5EFEB] p-1 rounded-xl self-start text-xs font-medium border border-[#332B27]/5">
        <button
          onClick={() => setActiveSubTab('regular')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeSubTab === 'regular'
              ? 'bg-white text-[#332B27] font-semibold shadow-xs'
              : 'text-[#332B27]/60 hover:text-[#332B27]'
          }`}
        >
          Weekly Hours
        </button>
        <button
          onClick={() => setActiveSubTab('blocked')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeSubTab === 'blocked'
              ? 'bg-white text-[#332B27] font-semibold shadow-xs'
              : 'text-[#332B27]/60 hover:text-[#332B27]'
          }`}
        >
          <span>Blocked Slots</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#F1E3A6] text-[#332B27] text-[10px] font-mono-tabular font-bold">
            {blockedSlots.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('timeoff')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeSubTab === 'timeoff'
              ? 'bg-white text-[#332B27] font-semibold shadow-xs'
              : 'text-[#332B27]/60 hover:text-[#332B27]'
          }`}
        >
          Time Off
        </button>
      </div>

      {/* REGULAR HOURS: Clean Day-by-Day Editor */}
      {activeSubTab === 'regular' && (
        <div className="space-y-3">
          {weeklyAvailability.map((item) => {
            return (
              <div
                key={item.day}
                className={`p-4 rounded-2xl border transition-all ${
                  item.enabled
                    ? 'bg-white border-[#332B27]/10 shadow-2xs'
                    : 'bg-[#FAF7F0]/60 border-[#332B27]/5 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Day and toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateDayAvailability(item.day, { enabled: !item.enabled })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        item.enabled ? 'bg-[#332B27]' : 'bg-[#332B27]/20'
                      }`}
                      role="switch"
                      aria-checked={item.enabled}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          item.enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#332B27] w-24">
                        {item.day}
                      </span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        item.enabled 
                          ? 'bg-[#AAB39A]/20 text-[#2B3822] border border-[#AAB39A]/40' 
                          : 'bg-[#F5EFEB] text-[#332B27]/50 border border-[#332B27]/5'
                      }`}>
                        {item.enabled ? 'Active' : 'Closed'}
                      </span>
                    </div>
                  </div>

                  {/* Hours Range */}
                  {item.enabled ? (
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-2 bg-[#FAF7F0] px-2.5 py-1 rounded-lg border border-[#332B27]/10 font-mono-tabular text-[#332B27]">
                        <span>{item.startTime}</span>
                        <span className="text-[#332B27]/30">–</span>
                        <span>{item.endTime}</span>
                      </div>

                      <span className="text-[#332B27]/50 text-[11px]">
                        {item.slotDurationMin}m sessions
                      </span>

                      <button
                        onClick={() => {
                          const nextEnd = item.endTime === '13:00' ? '14:00' : '13:00';
                          updateDayAvailability(item.day, { endTime: nextEnd });
                        }}
                        className="text-xs text-[#B89552] hover:text-[#332B27] hover:underline font-semibold cursor-pointer"
                      >
                        Adjust
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-[#332B27]/40 italic">
                      No consultations
                    </span>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BLOCKED SLOTS MANAGEMENT */}
      {activeSubTab === 'blocked' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-[#332B27]/10 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-[#332B27]">
              Block Time Slot
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans-clean">
              <div>
                <label className="block text-[#332B27]/60 mb-1 text-[11px] font-medium">Date</label>
                <input
                  type="text"
                  disabled
                  value={currentDate}
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#332B27]/15 rounded-xl font-mono-tabular text-[#332B27]/70"
                />
              </div>

              <div>
                <label className="block text-[#332B27]/60 mb-1 text-[11px] font-medium">Time</label>
                <select
                  value={newBlockTime}
                  onChange={(e) => setNewBlockTime(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#332B27]/15 rounded-xl font-mono-tabular text-[#332B27] focus:outline-none focus:border-[#B89552]"
                >
                  <option value="09:00">09:00 AM</option>
                  <option value="09:30">09:30 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="10:30">10:30 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="11:30">11:30 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="16:00">04:00 PM</option>
                  <option value="17:00">05:00 PM</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    toggleBlockSlot(currentDate, newBlockTime, 'hsr', newBlockReason);
                    addToast({ title: 'Slot Updated', message: `Block toggled for ${newBlockTime}.`, type: 'info' });
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-[#332B27] text-[#FAF7F0] text-xs font-semibold hover:bg-[#27201D] transition-colors cursor-pointer shadow-xs"
                >
                  Toggle Block
                </button>
              </div>
            </div>
          </div>

          {/* Active Blocked Slots List */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#332B27]/60 uppercase tracking-wider">
              Blocked Slots
            </p>
            {blockedSlots.length === 0 ? (
              <p className="text-xs text-[#332B27]/40 italic">No blocked slots currently.</p>
            ) : (
              blockedSlots.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl bg-white border border-[#332B27]/10 flex items-center justify-between text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-3.5 h-3.5 text-[#B89552] shrink-0" />
                    <div>
                      <span className="font-semibold text-[#332B27] font-mono-tabular">
                        {b.date} at {b.time}
                      </span>
                      <span className="text-[#332B27]/50 ml-2 text-[11px]">{b.reason}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleBlockSlot(b.date, b.time)}
                    className="px-3 py-1 rounded-lg bg-[#FAF7F0] border border-[#332B27]/15 text-[#332B27] hover:bg-white text-xs font-medium cursor-pointer transition-colors"
                  >
                    Unblock
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TIME OFF */}
      {activeSubTab === 'timeoff' && (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#332B27]/10 text-xs text-[#332B27]/60 space-y-3 shadow-xs">
          <Calendar className="w-6 h-6 text-[#B89552] mx-auto" />
          <h4 className="font-editorial text-xl font-medium text-[#332B27]">
            No Scheduled Practice Closures
          </h4>
          <p className="max-w-sm mx-auto text-[#332B27]/60">
            Add vacation or conference leave to automatically pause booking slots.
          </p>
          <button
            onClick={() => {
              addToast({ title: 'Time Off', message: 'Leave schedule planner opened.', type: 'info' });
            }}
            className="px-4 py-2 bg-[#332B27] text-[#FAF7F0] rounded-full text-xs font-semibold hover:bg-[#27201D] cursor-pointer"
          >
            + Add Leave Period
          </button>
        </div>
      )}

    </div>
  );
};
