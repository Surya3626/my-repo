package com.tataplay.fiber.onboarding.controller;

import com.tataplay.fiber.onboarding.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Provides address lookup data so the frontend has zero hardcoded location data.
 * All state/city/pincode information served from here.
 */
@RestController
@RequestMapping("/api/address")
public class AddressController {

    /**
     * Returns the supported states and their service cities.
     * Frontend uses this to populate state/city dropdowns.
     */
    @GetMapping("/states-cities")
    public ResponseEntity<ApiResponse<Map<String, List<String>>>> getStatesCities() {
        Map<String, List<String>> statesCities = new LinkedHashMap<>();
        statesCities.put("Maharashtra",   List.of("Mumbai", "Navi Mumbai", "Pune", "Nagpur", "Thane"));
        statesCities.put("Gujarat",       List.of("Ahmedabad", "Gandhinagar", "Surat", "Vadodara"));
        statesCities.put("Delhi",         List.of("New Delhi"));
        statesCities.put("Karnataka",     List.of("Bengaluru", "Mysore"));
        statesCities.put("Tamil Nadu",    List.of("Chennai", "Coimbatore"));
        statesCities.put("West Bengal",   List.of("Kolkata"));
        statesCities.put("Telangana",     List.of("Hyderabad"));
        statesCities.put("Uttar Pradesh", List.of("Noida", "Lucknow", "Agra"));
        statesCities.put("Rajasthan",     List.of("Jaipur", "Jodhpur"));
        statesCities.put("Punjab",        List.of("Chandigarh", "Amritsar", "Ludhiana"));
        statesCities.put("Kerala",        List.of("Kochi", "Thiruvananthapuram", "Kozhikode"));
        return ResponseEntity.ok(ApiResponse.success("States and service cities", statesCities));
    }

    /**
     * Lookup city and state for a given pincode.
     * Frontend replaces its hardcoded pincodeMap with this endpoint.
     */
    @GetMapping("/lookup")
    public ResponseEntity<ApiResponse<Map<String, String>>> lookupPincode(
            @RequestParam String pincode) {

        if (pincode == null || pincode.length() != 6) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid pincode — must be 6 digits", null));
        }

        Map<String, String> result = resolveFromPincode(pincode);
        if (result.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.error("Pincode not found in service area database", null));
        }
        return ResponseEntity.ok(ApiResponse.success("Address resolved", result));
    }

    // ─── Pincode resolution map ───────────────────────────────────────────────

    private Map<String, String> resolveFromPincode(String pin) {
        // Exact matches for major pincodes
        Map<String, Map<String, String>> exactMap = Map.ofEntries(
                Map.entry("400001", cityState("Mumbai", "Maharashtra")),
                Map.entry("400050", cityState("Mumbai", "Maharashtra")),
                Map.entry("400703", cityState("Navi Mumbai", "Maharashtra")),
                Map.entry("400705", cityState("Navi Mumbai", "Maharashtra")),
                Map.entry("411001", cityState("Pune", "Maharashtra")),
                Map.entry("411002", cityState("Pune", "Maharashtra")),
                Map.entry("411014", cityState("Pune", "Maharashtra")),
                Map.entry("382007", cityState("Gandhinagar", "Gujarat")),
                Map.entry("395001", cityState("Surat", "Gujarat")),
                Map.entry("380001", cityState("Ahmedabad", "Gujarat")),
                Map.entry("110001", cityState("New Delhi", "Delhi")),
                Map.entry("110002", cityState("New Delhi", "Delhi")),
                Map.entry("110020", cityState("New Delhi", "Delhi")),
                Map.entry("560001", cityState("Bengaluru", "Karnataka")),
                Map.entry("560002", cityState("Bengaluru", "Karnataka")),
                Map.entry("560034", cityState("Bengaluru", "Karnataka")),
                Map.entry("600001", cityState("Chennai", "Tamil Nadu")),
                Map.entry("700001", cityState("Kolkata", "West Bengal")),
                Map.entry("500001", cityState("Hyderabad", "Telangana")),
                Map.entry("201301", cityState("Noida", "Uttar Pradesh"))
        );

        if (exactMap.containsKey(pin)) {
            return exactMap.get(pin);
        }

        // Fallback by first two digits (coarse zone mapping)
        String prefix = pin.substring(0, 2);
        return switch (prefix) {
            case "40" -> cityState("Mumbai", "Maharashtra");
            case "41" -> cityState("Pune", "Maharashtra");
            case "38" -> cityState("Ahmedabad", "Gujarat");
            case "39" -> cityState("Surat", "Gujarat");
            case "11" -> cityState("New Delhi", "Delhi");
            case "56" -> cityState("Bengaluru", "Karnataka");
            case "60" -> cityState("Chennai", "Tamil Nadu");
            case "70" -> cityState("Kolkata", "West Bengal");
            case "50" -> cityState("Hyderabad", "Telangana");
            case "20", "22" -> cityState("Noida", "Uttar Pradesh");
            default -> {
                // Last resort: first digit zone
                char first = pin.charAt(0);
                yield switch (first) {
                    case '1' -> cityState("New Delhi", "Delhi");
                    case '2' -> cityState("Noida", "Uttar Pradesh");
                    case '3' -> cityState("Ahmedabad", "Gujarat");
                    case '4' -> cityState("Mumbai", "Maharashtra");
                    case '5' -> cityState("Bengaluru", "Karnataka");
                    case '6' -> cityState("Chennai", "Tamil Nadu");
                    case '7' -> cityState("Kolkata", "West Bengal");
                    case '8' -> cityState("Patna", "Bihar");
                    case '9' -> cityState("Jaipur", "Rajasthan");
                    default -> new HashMap<>();
                };
            }
        };
    }

    private Map<String, String> cityState(String city, String state) {
        Map<String, String> m = new HashMap<>();
        m.put("city", city);
        m.put("state", state);
        return m;
    }
}
