package adam.cli;

import adam.cli.N1710.Grupos;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.charset.Charset;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *
 * @author Adam
 */
public class Diretorio {

    private File diretorioAtual;
    private File diretorioDestino;
    public static boolean mostraSaida = true;
    public static int numeroArquivos = 0;

    public Diretorio() {
    }

    public Diretorio(String argumento) {

        this.diretorioAtual = new File(argumento);
        this.loopNaPasta();
    }

    public Diretorio(String[] argumentos) {

        this.diretorioAtual = new File(argumentos[0]);

        if (argumentos.length == 2) {
            mostraSaida = Boolean.parseBoolean(argumentos[1]);
            if (mostraSaida) {
                System.out.println("Saída ativada.");
            } else {
                System.out.println("Saída desativada.");
            }
        } else {
            if (argumentos.length == 3) {
                if (argumentos[2] != null) {
                    mostraSaida = Boolean.parseBoolean(argumentos[2]);
                    if (mostraSaida) {
                        System.out.println("Saída ativada.");
                    } else {
                        System.out.println("Saída desativada.");
                    }
                }
                if (argumentos[1] != null) {
                    diretorioDestino = new File(argumentos[1]);
                    System.out.println("Lendo de: " + argumentos[0]);
                    System.out.println("Escrevendo em: " + argumentos[1]);
                }
            }
        }

        this.loopNaPasta();
    }

    private void loopNaPasta() {

        int numeroPastas = 0;

        for (File f : diretorioAtual.listFiles()) {

            if (!f.isDirectory()) {
                numeroPastas++;
                numeroArquivos++;
            }
        }

        int contaArquivos = 0;

        for (File f : diretorioAtual.listFiles()) {

            if (mostraSaida) {
                //System.out.println(f.getName());
            }

            if (f.isDirectory()) {
                numeroPastas++;

                if (mostraSaida) {
                    System.out.println("\n============================================================================================\n"
                            + "[--]Pasta processada: " + f.getName());
                }
                this.separarEmGrupos(f, diretorioDestino);

            } else {
                contaArquivos++;
                System.out.print(100 * contaArquivos / numeroArquivos + "%\r");

                if (mostraSaida) {

                    System.out.println("\n============================================================================================\n"
                            + "[-]Arquivo processado: " + f.getName());
                }
                this.separarEmGrupos(f, diretorioDestino);
            }
        }

        //Quando terminar o loop, escreve o CSV
        if (mostraSaida) {
            System.out.println("Encontradas "
                    + numeroPastas + " pastas e " + numeroArquivos
                    + " arquivos. \n============================================================================================");
        }
        this.gerarSaidaCSV();

    }

    private void separarEmGrupos(File arquivoOrigem, File diretorioDestino) {

        if (mostraSaida) {
            System.out.println("Dados no log de saída: " + Grupos.listaSaidaCSV.size());
        }
        new Grupos(arquivoOrigem, diretorioDestino);

    }

    private void gerarSaidaCSV() {

        //Prepara arquivo de saída, para eventual escrita dos padrões encontrados
        FileWriter fw;
        BufferedWriter bw;

        try {

            String pastaExecutavel = new File(this.getClass().getProtectionDomain().getCodeSource().getLocation().toURI()).getParent();
            File arquivoSaida = new File(pastaExecutavel + "\\Lista.csv");
            //System.out.println("User dir " + arquivoSaida);

            fw = new FileWriter(arquivoSaida);
            bw = new BufferedWriter(fw);

            bw.write("Nome_Original;G0;G1;G2;G3;G4;G5;G6;G7;SIGEM_A;SIGEM_B;Sistema;Pasta_Final;Link\r\n");

            for (String s : Grupos.listaSaidaCSV) {
                bw.write(s);
            }

            bw.close();
            fw.close();

        } catch (IOException e) {
        } catch (URISyntaxException ex) {
            Logger.getLogger(Diretorio.class.getName()).log(Level.SEVERE, null, ex);
        }

    }

}
