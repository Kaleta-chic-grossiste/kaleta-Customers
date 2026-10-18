public  class Pizza
{
    private string nom { get; set;}
    private double  prix {get; set;}
    private List<string> ingredients { get; set;}

    public  Pizza(string nom, double prix, List<string> ingredients)
    {
        this.nom = nom;
        this.prix = prix;
        this.ingredients = ingredients;
    }

    public int CompareTo(object obj)
    {
        Pizza p = (Pizza)obj;
        return this.prix.CompareTo(p.prix);
    }

    public override string ToString()
    {
        return $"Pizza: {nom}, Prix: {prix}, Ingredients: {string.Join(", ", ingredients)}";
    }

    public class PizzaGratuite : Pizza
    {
        public PizzaGratuite(string nom, List<string> ingredients) : base(nom, 0, ingredients)
        { 
        }

        public override string ToString()
        {
            return $"Pizza Gratuite: {nom}, Ingredients: {string.Join(", ", ingredients)}";
        }
        
    }