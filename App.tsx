import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CheckCircle2, 
  Scissors, 
  ChevronRight, 
  ChevronLeft,
  AlertCircle,
  Menu,
  X,
  Instagram,
  Facebook,
  MapPin,
  ExternalLink
} from 'lucide-react';

// Tipagem para os agendamentos
interface Appointment {
  id?: string;
  customer_name: string;
  customer_phone: string;
  service: string;
  date: string;
  time: string;
  status: string;
  created_at?: string;
}

const services = [
  { id: 'corte', name: 'Corte de Cabelo', price: 'R$ 40,00', duration: '30 min' },
  { id: 'barba', name: 'Barba Completa', price: 'R$ 30,00', duration: '20 min' },
  { id: 'combo', name: 'Combo (Corte + Barba)', price: 'R$ 65,00', duration: '50 min' },
  { id: 'sobrancelha', name: 'Sobrancelha', price: 'R$ 15,00', duration: '10 min' },
];

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
];

function App() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedAppointments, setBookedAppointments] = useState<Appointment[]>([]);
  const [occupiedTimes, setOccupiedTimes] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Buscar agendamentos existentes
  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments');
      if (response.ok) {
        const data = await response.json();
        setBookedAppointments(data);
      }
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filtrar horários ocupados quando a data mudar
  useEffect(() => {
    if (selectedDate && bookedAppointments.length > 0) {
      const occupied = bookedAppointments
        .filter(app => app.date === selectedDate)
        .map(app => app.time);
      setOccupiedTimes(occupied);
    } else if (!selectedDate) {
      setOccupiedTimes([]);
    }
  }, [selectedDate, bookedAppointments]);

  const handleServiceSelect = (id: string) => {
    setSelectedService(id);
    setStep(2);
  };

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    // Avança para o passo 3 (horários) assim que a data é selecionada
    if (date) {
      setStep(3);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(4);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const serviceName = services.find(s => s.id === selectedService)?.name || '';
    
    const appointmentData: Appointment = {
      customer_name: name,
      customer_phone: phone,
      service: serviceName,
      date: selectedDate,
      time: selectedTime,
      status: 'pendente'
    };

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
      });

      if (response.ok) {
        setStep(5);
        // Enviar para o WhatsApp
        const message = `Olá! Gostaria de confirmar meu agendamento na Barbearia Macchine:%0A%0A*Serviço:* ${serviceName}%0A*Data:* ${new Date(selectedDate).toLocaleDateString('pt-BR')}%0A*Horário:* ${selectedTime}%0A*Nome:* ${name}`;
        window.open(`https://wa.me/5515997455431?text=${message}`, '_blank' );
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao realizar agendamento. Tente outro horário.');
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente mais tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      {/* Header */}
      <header className="bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/logo-preview.jpg" alt="Logo" className="w-10 h-10 rounded-full object-cover border border-amber-500" />
            <span className="text-xl font-bold tracking-tighter text-amber-500">MACCHINE</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#inicio" className="text-sm font-medium hover:text-amber-500 transition-colors">Início</a>
            <a href="#servicos" className="text-sm font-medium hover:text-amber-500 transition-colors">Serviços</a>
            <a href="#agendar" className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-full text-sm font-bold transition-all transform hover:scale-105">Agendar Agora</a>
          </nav>

          <button className="md:hidden text-neutral-400" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent opacity-50"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="flex justify-center mb-6">
            <img src="/logo-preview.jpg" alt="Logo" className="w-32 h-32 rounded-full object-cover border-4 border-amber-500 shadow-2xl shadow-amber-500/20" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter">BARBEARIA <span className="text-amber-500">MACCHINE</span></h1>
          <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Estilo, tradição e a melhor experiência para o seu visual em Boituva. 
            Agende seu horário com os melhores profissionais da região.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <a href="#agendar" className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2">
              <Calendar size={20} /> Agendar Agora
            </a>
            <a href="https://instagram.com" target="_blank" className="bg-neutral-800 hover:bg-neutral-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all flex items-center justify-center gap-2">
              <Instagram size={20} /> Ver Instagram
            </a>
          </div>
        </div>
      </section>

      {/* Booking Widget */}
      <section id="agendar" className="py-20 bg-neutral-900/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-4 mb-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-500'}`}>1</div>
                <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-amber-500' : 'bg-neutral-800'}`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-500'}`}>2</div>
                <div className={`flex-1 h-1 rounded-full ${step >= 3 ? 'bg-amber-500' : 'bg-neutral-800'}`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-500'}`}>3</div>
                <div className={`flex-1 h-1 rounded-full ${step >= 4 ? 'bg-amber-500' : 'bg-neutral-800'}`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 4 ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-500'}`}>4</div>
              </div>

              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                    <Scissors className="text-amber-500" /> Escolha o Serviço
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {services.map((service ) => (
                      <button
                        key={service.id}
                        onClick={() => handleServiceSelect(service.id)}
                        className={`p-6 rounded-2xl border text-left transition-all hover:border-amber-500 group ${selectedService === service.id ? 'border-amber-500 bg-amber-500/10' : 'border-neutral-800 bg-neutral-800/50'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-xl group-hover:text-amber-500">{service.name}</h3>
                          <span className="text-amber-500 font-bold">{service.price}</span>
                        </div>
                        <p className="text-neutral-400 text-sm flex items-center gap-2">
                          <Clock size={14} /> {service.duration}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => setStep(1)} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
                      <ChevronLeft size={24} />
                    </button>
                    <h2 className="text-3xl font-bold flex items-center gap-3">
                      <Calendar className="text-amber-500" /> Selecione a Data
                    </h2>
                  </div>
                  <div className="bg-neutral-800/50 p-8 rounded-2xl border border-neutral-800">
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Escolha o dia desejado:</label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      onChange={handleDateSelect}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-4 text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => setStep(2)} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
                      <ChevronLeft size={24} />
                    </button>
                    <h2 className="text-3xl font-bold flex items-center gap-3">
                      <Clock className="text-amber-500" /> Horários Disponíveis
                    </h2>
                  </div>
                  <p className="mb-6 text-neutral-400">Exibindo horários para: <span className="text-white font-bold">{new Date(selectedDate).toLocaleDateString('pt-BR')}</span></p>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {timeSlots.map((time) => {
                      const isOccupied = occupiedTimes.includes(time);
                      return (
                        <button
                          key={time}
                          disabled={isOccupied}
                          onClick={() => handleTimeSelect(time)}
                          className={`p-4 rounded-xl border text-center font-bold transition-all ${
                            isOccupied 
                              ? 'bg-neutral-900 border-neutral-800 text-neutral-700 cursor-not-allowed line-through' 
                              : selectedTime === time 
                                ? 'border-amber-500 bg-amber-500 text-black' 
                                : 'border-neutral-800 bg-neutral-800/50 hover:border-amber-500 hover:text-amber-500'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => setStep(3)} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
                      <ChevronLeft size={24} />
                    </button>
                    <h2 className="text-3xl font-bold flex items-center gap-3">
                      <User className="text-amber-500" /> Seus Dados
                    </h2>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-400">Nome Completo</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                          <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Seu nome aqui"
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-amber-500 transition-colors"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-400">WhatsApp</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                          <input
                            required
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="(00) 00000-0000"
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-amber-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-500">
                        <AlertCircle size={20} /> {error}
                      </div>
                    )}

                    <div className="bg-neutral-800/30 p-6 rounded-2xl border border-neutral-800 space-y-3">
                      <h3 className="font-bold text-lg mb-2">Resumo do Agendamento:</h3>
                      <div className="flex justify-between text-neutral-400">
                        <span>Serviço:</span>
                        <span className="text-white">{services.find(s => s.id === selectedService)?.name}</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>Data:</span>
                        <span className="text-white">{new Date(selectedDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>Horário:</span>
                        <span className="text-white">{selectedTime}</span>
                      </div>
                      <div className="pt-3 border-t border-neutral-700 flex justify-between font-bold text-xl">
                        <span>Total:</span>
                        <span className="text-amber-500">{services.find(s => s.id === selectedService)?.price}</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-neutral-700 text-white py-5 rounded-2xl text-xl font-black transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-amber-900/20 flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? 'Agendando...' : 'Confirmar e Finalizar'} <ChevronRight size={24} />
                    </button>
                  </form>
                </div>
              )}

              {step === 5 && (
                <div className="text-center py-10 animate-in zoom-in duration-500">
                  <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                      <CheckCircle2 size={64} />
                    </div>
                  </div>
                  <h2 className="text-4xl font-black mb-4">Agendamento Solicitado!</h2>
                  <p className="text-neutral-400 text-lg mb-8 max-w-md mx-auto">
                    Parabéns, {name.split(' ')[0]}! Seu horário foi reservado. Você será redirecionado para o nosso WhatsApp para confirmar os detalhes.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-neutral-800 hover:bg-neutral-700 text-white px-8 py-4 rounded-xl font-bold transition-all"
                  >
                    Fazer outro agendamento
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-20 border-t border-neutral-900">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                  <MapPin size={32} />
                </div>
              </div>
              <h3 className="text-2xl font-bold">Localização</h3>
              <p className="text-neutral-400">Rua Exemplo, 123 - Centro  
Boituva, SP</p>
              <a href="#" className="text-amber-500 font-bold inline-flex items-center gap-1 hover:underline">
                Ver no Mapa <ExternalLink size={14} />
              </a>
            </div>
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                  <Clock size={32} />
                </div>
              </div>
              <h3 className="text-2xl font-bold">Horários</h3>
              <p className="text-neutral-400">Terça a Sexta: 09h às 19h  
Sábado: 08h às 18h</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                  <Phone size={32} />
                </div>
              </div>
              <h3 className="text-2xl font-bold">Contato</h3>
              <p className="text-neutral-400">(15) 99745-5431</p>
              <div className="flex justify-center gap-4">
                <a href="#" className="text-neutral-400 hover:text-amber-500 transition-colors"><Instagram size={24} /></a>
                <a href="#" className="text-neutral-400 hover:text-amber-500 transition-colors"><Facebook size={24} /></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-black border-t border-neutral-900 text-center text-neutral-500 text-sm">
        <div className="container mx-auto px-4">
          <p>© 2024 Barbearia Macchine. Todos os direitos reservados.</p>
          <p className="mt-2">Desenvolvido para oferecer a melhor experiência em Boituva.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
