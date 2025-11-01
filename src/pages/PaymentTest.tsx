import { useState } from 'react';
import { useEscrowPayments } from '@/hooks/useEscrowPayments';
import { getAvailablePaymentMethods, PAYMENT_METHODS } from '@/lib/paymentRegions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Euro, Smartphone, CreditCard, Package } from 'lucide-react';

export default function PaymentTest() {
  const { toast } = useToast();
  const { initiateEscrowPayment, confirmDeliveryAndReleaseFunds, processing } = useEscrowPayments();
  
  const [testData, setTestData] = useState({
    amount: 50,
    weight: 5,
    fromCountry: 'FR',
    toCountry: 'SN',
    phoneNumber: '',
    paymentMethod: '',
  });
  
  const [testReservationId, setTestReservationId] = useState<string>('');
  
  const availablePaymentMethods = getAvailablePaymentMethods(testData.fromCountry.toLowerCase());
  
  const handleTestPayment = async () => {
    if (!testData.paymentMethod) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un moyen de paiement',
        variant: 'destructive',
      });
      return;
    }
    
    if (testData.paymentMethod !== PAYMENT_METHODS.STRIPE_CARD && !testData.phoneNumber) {
      toast({
        title: 'Erreur',
        description: 'Numéro de téléphone requis pour les paiements mobile money',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await initiateEscrowPayment({
        reservation_id: `test-${Date.now()}`,
        amount: testData.amount,
        currency: 'EUR',
        payment_method: testData.paymentMethod,
        phone_number: testData.phoneNumber || undefined,
        traveler_id: 'test-traveler',
        customer_id: 'test-customer',
      });
      
      if (result?.reservation_id) {
        setTestReservationId(result.reservation_id);
      }
      
      toast({
        title: 'Test de paiement initié',
        description: `Paiement de ${testData.amount}€ avec ${testData.paymentMethod}`,
      });
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  };
  
  const handleTestDelivery = async () => {
    if (!testReservationId) {
      toast({
        title: 'Erreur',
        description: 'Aucune réservation de test trouvée',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await confirmDeliveryAndReleaseFunds({
        reservation_id: testReservationId,
        delivery_photos: [], // Test sans photos
      });
      
      toast({
        title: 'Livraison confirmée',
        description: 'Fonds transférés avec succès',
      });
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    if (method === PAYMENT_METHODS.STRIPE_CARD) {
      return <CreditCard className="w-4 h-4" />;
    }
    return <Smartphone className="w-4 h-4" />;
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case PAYMENT_METHODS.STRIPE_CARD:
        return 'Carte bancaire';
      case PAYMENT_METHODS.ORANGE_MONEY:
        return 'Orange Money';
      case PAYMENT_METHODS.MTN_MONEY:
        return 'MTN Money';
      case PAYMENT_METHODS.WAVE:
        return 'Wave';
      case PAYMENT_METHODS.MOOV_MONEY:
        return 'Moov Money';
      case PAYMENT_METHODS.AIRTEL_MONEY:
        return 'Airtel Money';
      default:
        return method;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test du Système de Paiement Escrow</h1>
        <p className="text-muted-foreground">
          Interface de test pour vérifier le fonctionnement des paiements régionaux avec escrow.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuration du test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Configuration du test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Montant (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={testData.amount}
                  onChange={(e) => setTestData(prev => ({ 
                    ...prev, 
                    amount: Number(e.target.value) 
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="weight">Poids (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={testData.weight}
                  onChange={(e) => setTestData(prev => ({ 
                    ...prev, 
                    weight: Number(e.target.value) 
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromCountry">Pays de départ</Label>
                <Select
                  value={testData.fromCountry}
                  onValueChange={(value) => setTestData(prev => ({ 
                    ...prev, 
                    fromCountry: value,
                    paymentMethod: '' // Reset payment method when country changes
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FR">France</SelectItem>
                    <SelectItem value="SN">Sénégal</SelectItem>
                    <SelectItem value="ML">Mali</SelectItem>
                    <SelectItem value="CI">Côte d'Ivoire</SelectItem>
                    <SelectItem value="MA">Maroc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="toCountry">Pays de destination</Label>
                <Select
                  value={testData.toCountry}
                  onValueChange={(value) => setTestData(prev => ({ ...prev, toCountry: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FR">France</SelectItem>
                    <SelectItem value="SN">Sénégal</SelectItem>
                    <SelectItem value="ML">Mali</SelectItem>
                    <SelectItem value="CI">Côte d'Ivoire</SelectItem>
                    <SelectItem value="MA">Maroc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="paymentMethod">Moyen de paiement</Label>
              <Select
                value={testData.paymentMethod}
                onValueChange={(value) => setTestData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un moyen de paiement" />
                </SelectTrigger>
                <SelectContent>
                  {availablePaymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(method.id)}
                        {getPaymentMethodLabel(method.id)}
                        <Badge variant="outline" className="ml-auto">
                          {method.fees?.percentage || 0}%
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {testData.paymentMethod !== PAYMENT_METHODS.STRIPE_CARD && (
              <div>
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+221 77 123 45 67"
                  value={testData.phoneNumber}
                  onChange={(e) => setTestData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions de test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="w-5 h-5" />
              Actions de test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">1. Initier un paiement escrow</h4>
                <Button 
                  onClick={handleTestPayment}
                  disabled={processing || !testData.paymentMethod}
                  className="w-full"
                >
                  {processing ? 'Traitement...' : 'Tester le paiement'}
                </Button>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">2. Confirmer la livraison</h4>
                <Button 
                  onClick={handleTestDelivery}
                  disabled={processing || !testReservationId}
                  variant="outline"
                  className="w-full"
                >
                  {processing ? 'Confirmation...' : 'Confirmer la livraison'}
                </Button>
              </div>
            </div>

            {testReservationId && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>ID de test:</strong> {testReservationId}
                </p>
              </div>
            )}

            {/* Résumé des moyens de paiement disponibles */}
            <div className="mt-6">
              <h4 className="font-medium mb-3">Moyens de paiement pour {testData.fromCountry}</h4>
              <div className="space-y-2">
                {availablePaymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(method.id)}
                      <span className="text-sm">{getPaymentMethodLabel(method.id)}</span>
                    </div>
                    <Badge variant="outline">{method.fees?.percentage || 0}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}