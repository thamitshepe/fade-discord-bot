module.exports = {
  colors: {
    primary: 0x5865F2,
    success: 0x57F287,
    warning: 0xFEE75C,
    danger: 0xED4245,
    embed: 0x2B2D31,
  },

  services: [
    { label: 'Core Optimization — €90', value: 'core_optimization', price: 90, recurring: false },
    { label: 'Signature Optimization — €130', value: 'signature_optimization', price: 130, recurring: false },
    { label: 'Care Plan — €25/month', value: 'care_plan', price: 25, recurring: true },
  ],

  serviceDetails: {
    core_optimization: {
      name: 'Core Optimization',
      price: '€90',
      duration: '~45-60 mins',
      description: 'Full system optimization covering BIOS, Windows, drivers, and more.',
      includes: [
        'BIOS Optimization (including Hidden BIOS)',
        'Full Windows Optimization',
        'Deep System Debloating',
        'GPU Driver & Settings Optimization (NVIDIA / AMD)',
        'Network Optimization',
        'Input & Latency Optimization',
        'Custom Power Plan',
        'Registry Optimization',
        'Process Reduction',
        'Game & Application Optimization',
        'System Stability Testing & Verification',
      ],
      audience: 'If you experience stuttering, input lag, or FPS drops, this session is built for you.',
    },
    signature_optimization: {
      name: 'Signature Optimization',
      price: '€130',
      duration: '~90 mins',
      description: 'Everything in Core Optimization plus advanced memory tuning and extended validation.',
      includes: [
        'Everything included in Core Optimization',
        'Advanced Memory Tuning (frequency, timings, and fabric optimization)',
        'Extended Stability Testing & Validation',
      ],
      audience: 'For competitive players who want every possible edge extracted from their hardware.',
    },
    care_plan: {
      name: 'Care Plan',
      price: '€25/month',
      duration: 'Ongoing',
      description: 'Monthly system maintenance to keep your optimizations running at peak performance.',
      includes: [
        'Monthly system check-up & optimization verification',
        'Performance, stability & temperature monitoring',
        'System cleanup (temp files, startup items, background processes)',
        'Configuration review (checking for issues or performance loss if you messed up anything)',
        'Priority troubleshooting & support',
      ],
      audience: 'For clients who want ongoing peace of mind after their session.',
    },
  },

  paymentMethods: [
    { label: 'PayPal (Friends & Family)', value: 'paypal' },
    { label: 'Crypto', value: 'crypto' },
    { label: 'PaySafeCard (+€15 fee)', value: 'paysafecard' },
    { label: 'Gift Card (+€15 fee)', value: 'giftcard' },
  ],

  goals: [
    { label: 'Higher FPS', value: 'higher_fps' },
    { label: 'Less Input Lag', value: 'less_input_lag' },
    { label: 'Stability', value: 'stability' },
  ],

  customIds: {
    ticketPanelSelect: 'ticket_panel_select',
    continueBooking: 'continue_booking',
    serviceSelect: 'service_select',
    paymentSelect: 'payment_select',
    goalSelect: 'goal_select',
    bookingForm: 'booking_form',
    pcSpecsInput: 'pc_specs_input',
    gamesInput: 'games_input',
    appsInput: 'apps_input',
    // Ticket management
    reviewTicket: 'review_ticket',
    closeTicket: 'close_ticket',
    closeTicketModal: 'close_ticket_modal',
    closeReasonInput: 'close_reason_input',
    confirmClose: 'confirm_close',
    cancelClose: 'cancel_close',
    // New booking flow
    selectService: 'select_service',
    confirmService: 'confirm_service',
    askQuestion: 'ask_question',
    selectPayment: 'select_payment',
    selectGoal: 'select_goal',
    bookingModal: 'booking_modal',
    // New modal fields
    bookingPcSpecsInput: 'booking_pc_specs_input',
    bookingGamesInput: 'booking_games_input',
    bookingAppsInput: 'booking_apps_input',
  },
};
