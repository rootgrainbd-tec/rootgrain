import "server-only";
import { ShippingRepository } from "@/repositories/shipping.repository";

export class ShippingService {
  static async getAllRates() {
    return ShippingRepository.getAllRates();
  }

  static async getRateByDistrict(district: string) {
    return ShippingRepository.getShippingRateByDistrict(district);
  }
}
