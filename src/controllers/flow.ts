import { Request, Response } from "express";

// Helper function for street search (you'll need to implement this)
async function searchStreetInCity(city: string, street: string) {
  // Mock implementation - replace with your actual street search logic
  if (street && street.length > 2) {
    return [
      {
        id: `${city}-${street}`,
        title: `${street}, ${city}`,
      },
    ];
  }
  return null;
}

export const handleFlow = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const { screen, data, version, action } = body;

    console.log("Flow request:", JSON.stringify(body, null, 2));

    let responseBody = null;

    switch (action) {
      case "INIT": {
        // Initialize flow - calculate delivery price based on location
        let price = 0;
        // You can implement getAirDistance function here
        // const getDeliveryRange = await getAirDistance(
        //   "הנדיב 6, הרצליה, ישראל",
        //   data.street
        // );
        // if (getDeliveryRange > 10) {
        //   price = 10;
        // } else {
        //   price = 5;
        // }

        responseBody = {
          version,
          screen,
          data: {
            price_delivery: `תשלום משלוח: ${price}₪`,
            min_date: "2025-01-20",
            max_date: "2025-01-22",
            delivery: true,
            futrue_delivery: false,
            cities: [
              {
                id: "חיפה",
                title: "חיפה",
                description: "עיר חוף בצפון",
                metadata: "אזור צפון",
              },
              {
                id: "ירושלים",
                title: "ירושלים",
                description: "העיר הקדושה",
                metadata: "אזור מרכז",
              },
              {
                id: "תל אביב",
                title: "תל אביב",
                description: "העיר המרכזית",
                metadata: "אזור מרכז",
              },
            ],
            streets: [
              {
                id: "kosovsi",
                title: "הרב קוסובקי 8",
              },
            ],
            full_address: "",
            fix: false,
          },
        };
        break;
      }

      case "data_exchange": {
        if (data.type === "city") {
          // Handle city/street search
          const cityMatches = await searchStreetInCity(data.city, data.street);
          let dataReturn = {};

          if (!cityMatches) {
            dataReturn = {
              fix: false,
            };
          } else if (cityMatches.length > 1 && !data.street_picked) {
            dataReturn = {
              fix: true,
              streets: cityMatches,
            };
          } else {
            responseBody = {
              version,
              screen: "DETAILS",
              data: {
                city: data.city,
                street: data.street_picked
                  ? `${data.street_picked.split("-")[1]}`
                  : `${cityMatches[0].title.split(",")[0]}`,
                number_house: data.number_house,
                floor: data.floor,
                apartment: data.apartment,
                delivery_date: data.delivery_date,
                delivery_hour: data.delivery_hour,
                full_address: data.street_picked
                  ? `${data.street_picked.split("-")[1]}` +
                    " " +
                    data.number_house +
                    ", " +
                    data.city
                  : `${cityMatches[0].title.split(",")[0]}` +
                    " " +
                    data.number_house +
                    ", " +
                    data.city,
                price_delivery: "עלות משלוח: ₪0",
              },
            };
            break;
          }

          responseBody = {
            version,
            screen,
            data: dataReturn,
          };
          break;
        }
        break;
      }

      case "ping": {
        // Health check for flow
        responseBody = {
          data: {
            status: "active",
          },
        };
        break;
      }

      default: {
        console.log("Unknown action:", action);
        responseBody = {
          version,
          screen,
          data: {},
        };
        break;
      }
    }

    console.log("Flow response:", JSON.stringify(responseBody, null, 2));

    return res.status(200).json(responseBody);
  } catch (error) {
    console.error("Flow error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
