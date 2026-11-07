module.exports = {
  colors: {
    primary: 0x5865F2,
    success: 0x57F287,
    warning: 0xFEE75C,
    danger: 0xED4245,
    embed: 0x2B2D31,
  },

  services: [
    {
      label: 'Complete PC Optimization — €60',
      value: 'complete_pc_optimization',
      price: 60,
      recurring: false,
    },
  ],

  serviceDetails: {
    complete_pc_optimization: {
      name: 'Complete PC Optimization',
      price: '€60',
      duration: 'Approximately 10 minutes for Windows setup; full session varies by system',

      description:
        'An all-in-one optimization service covering BIOS, Windows, GPU drivers, networking, and system-level performance configuration.',

      includes: [
        'Full BIOS configuration and advanced hidden BIOS settings',
        'CPU and RAM behaviour optimization',
        'Windows 11 installation assistance',
        'Complete Windows configuration and debloating',
        'NVIDIA / AMD GPU driver optimization',
        'Debloated GPU driver installation',
        'Custom NVPI profile for NVIDIA GPUs',
        'GPU performance and power configuration',
        'Network optimization, including NetAdapterCx and NDIS settings',
        'Network power-saving configuration',
        'Windows thread and processor scheduling optimization',
        'Core-to-core latency optimization for multi-CCD Ryzen CPUs and Intel E-cores',
        'System responsiveness and latency configuration',
        'Final configuration review and stability checks',
      ],

      benefits: [
        'Improve FPS consistency and responsiveness',
        'Reduce frame-time variance and micro-stuttering',
        'Reduce input and system latency',
        'Reduce unnecessary power-saving delays',
        'Improve CPU scheduling and thread behaviour',
        'Maintain compatibility with supported anti-cheat systems',
      ],

      audience:
        'For players experiencing inconsistent FPS, stuttering, frame drops, input delay, or general system performance issues.',
    },
  },

  paymentMethods: [
    {
      label: 'PayPal (Friends & Family)',
      value: 'paypal',
    },
    {
      label: 'Crypto',
      value: 'crypto',
    },
    {
      label: 'PaySafeCard (+€15 fee)',
      value: 'paysafecard',
    },
    {
      label: 'Gift Card (+€15 fee)',
      value: 'giftcard',
    },
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

    // Booking flow
    selectService: 'select_service',
    confirmService: 'confirm_service',
    askQuestion: 'ask_question',
    selectPayment: 'select_payment',

    // Questionnaire modals
    bookingModal: 'booking_modal',
    bookingDetailsModal: 'booking_details_modal',

    // First questionnaire
    bookingNameInput: 'booking_name_input',
    bookingCpuInput: 'booking_cpu_input',
    bookingGpuInput: 'booking_gpu_input',
    bookingMotherboardInput: 'booking_motherboard_input',
    bookingRamInput: 'booking_ram_input',

    // Second questionnaire
    bookingObjectiveInput: 'booking_objective_input',
    bookingGamesInput: 'booking_games_input',
    bookingWindowsInput: 'booking_windows_input',
    bookingAvailabilityInput: 'booking_availability_input',
    bookingAppsInput: 'booking_apps_input',

    // Legacy fields
    bookingPcSpecsInput: 'booking_pc_specs_input',
  },
};